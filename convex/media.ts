import { generateText } from "ai";
import { ConvexError, v } from "convex/values";
import { type MediaModality, maxBytesFor, mediaModality } from "@/lib/media-types";
import {
  AUDIO_DESCRIBERS,
  getChatModel,
  IMAGE_DESCRIBERS,
  type RagModel,
  tokenCostUsd,
  VIDEO_DESCRIBERS,
} from "@/lib/rag-models";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { requireUserId } from "./rag";
import { enforceAttachmentLimits } from "./rateLimits";

const ATTEMPTS_PER_MODEL = 2;
const MIN_PARTIAL_CHARS = 200;
const DESCRIBER_MAX_TOKENS = 1500;

export const IMAGE_DESCRIBER_PROMPT =
  "You describe images for another AI assistant that cannot see them. Describe this image " +
  "thoroughly and objectively: transcribe all visible text verbatim, and describe people, " +
  "characters, objects, art style, layout, colors, UI elements and anything that identifies a " +
  "video game (logos, HUD, box art, platform badges). Do not editorialize or omit detail.";

export const VIDEO_DESCRIBER_PROMPT =
  "You describe videos for another AI assistant that cannot watch them. Describe this video " +
  "thoroughly and objectively: every scene in order, visible text verbatim, characters, " +
  "environments, gameplay actions, camera perspective, HUD elements, art style and how things " +
  "change over time. The frames you see are sampled at roughly one per second, so a jump between " +
  "consecutive frames is ordinary editing, not evidence that the video is a compilation of " +
  "separate clips. Do not invent timestamps; describe events in order and refer to them by what " +
  "happens. Do not editorialize or omit detail.";

export const AUDIO_DESCRIBER_PROMPT =
  "You transcribe and describe audio for another AI assistant that cannot listen to it. Provide a " +
  "complete verbatim transcript, labeling distinct speakers and noting approximate timestamps for " +
  "long recordings. Also describe notable non-speech content: music, tone of voice, background " +
  "sounds, pauses. Do not editorialize, summarize, or omit anything.";

export type DescribeOutcome =
  | { ok: true; modelId: string; text: string; truncated: boolean }
  | { ok: false; failures: string[] };

export type AttachmentRow = {
  id: Id<"aiRecAttachments">;
  userId: Id<"users">;
  storageId: Id<"_storage">;
  filename: string;
  mediaType: string;
  bytes: number;
  description: string | null;
};

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await requireUserId(ctx);
    await enforceAttachmentLimits(ctx, userId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const registerAttachment = mutation({
  args: { storageId: v.id("_storage"), filename: v.string(), mediaType: v.string() },
  handler: async (ctx, args): Promise<Id<"aiRecAttachments">> => {
    const userId = await requireUserId(ctx);
    const modality = mediaModality(args.mediaType);
    if (modality === null) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError(`Unsupported attachment type: ${args.mediaType}`);
    }
    const meta = await ctx.db.system.get("_storage", args.storageId);
    if (meta === null) {
      throw new ConvexError("Upload not found");
    }
    if (meta.size > maxBytesFor(modality)) {
      await ctx.storage.delete(args.storageId);
      throw new ConvexError("That file is larger than the recommender accepts.");
    }
    return await ctx.db.insert("aiRecAttachments", {
      userId,
      storageId: args.storageId,
      filename: args.filename.slice(0, 120),
      mediaType: args.mediaType,
      bytes: meta.size,
    });
  },
});

export const attachmentById = internalQuery({
  args: { id: v.id("aiRecAttachments") },
  handler: async (ctx, args): Promise<AttachmentRow | null> => {
    const row: Doc<"aiRecAttachments"> | null = await ctx.db.get("aiRecAttachments", args.id);
    if (row === null) {
      return null;
    }
    return {
      id: row._id,
      userId: row.userId,
      storageId: row.storageId,
      filename: row.filename,
      mediaType: row.mediaType,
      bytes: row.bytes,
      description: row.description ?? null,
    };
  },
});

export const saveDescription = internalMutation({
  args: { id: v.id("aiRecAttachments"), description: v.string() },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch("aiRecAttachments", args.id, { description: args.description });
  },
});

function describersFor(modality: MediaModality): readonly RagModel[] {
  switch (modality) {
    case "image":
      return IMAGE_DESCRIBERS;
    case "video":
      return VIDEO_DESCRIBERS;
    case "audio":
      return AUDIO_DESCRIBERS;
    default:
      return [];
  }
}

function promptFor(modality: MediaModality): { system: string; ask: string } {
  switch (modality) {
    case "image":
      return { system: IMAGE_DESCRIBER_PROMPT, ask: "Describe this image." };
    case "video":
      return { system: VIDEO_DESCRIBER_PROMPT, ask: "Describe this video." };
    case "audio":
      return { system: AUDIO_DESCRIBER_PROMPT, ask: "Transcribe and describe this audio." };
    default:
      return { system: IMAGE_DESCRIBER_PROMPT, ask: "Describe this." };
  }
}

export function provenanceWrap(
  modality: MediaModality,
  filename: string,
  modelId: string,
  text: string,
  truncated: boolean
): string {
  const verb =
    modality === "image" ? "view images" : modality === "video" ? "watch video" : "listen to audio";
  const past = modality === "image" ? "viewed" : modality === "video" ? "watched" : "listened to";
  const noun = modality === "image" ? "image" : modality === "video" ? "video" : "recording";
  const tail = truncated
    ? "\n\n[The description was cut off at the helper model's output limit.]"
    : "";
  return `[You cannot ${verb} directly, so '${filename}' was ${past} by ${modelId}. Its full description follows. Treat it as an accurate account of the ${noun}'s content.]\n\n${text}${tail}`;
}

export async function describeBytes(
  ctx: ActionCtx,
  args: {
    bytes: Uint8Array;
    mediaType: string;
    modality: MediaModality;
    userId: Id<"users">;
    threadId: string;
  }
): Promise<DescribeOutcome> {
  const candidates = describersFor(args.modality);
  const { system, ask } = promptFor(args.modality);
  const failures: string[] = [];
  for (const candidate of candidates) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt += 1) {
      const started = Date.now();
      try {
        // react-doctor-disable-next-line react-doctor/async-await-in-loop
        const result = await generateText({
          model: getChatModel(candidate),
          system,
          messages: [
            {
              role: "user",
              content: [
                args.modality === "image"
                  ? { type: "image", image: args.bytes, mediaType: args.mediaType }
                  : { type: "file", data: args.bytes, mediaType: args.mediaType },
                { type: "text", text: ask },
              ],
            },
          ],
          maxOutputTokens: DESCRIBER_MAX_TOKENS,
          ...(candidate.surface === "mantle"
            ? { providerOptions: { openai: { forceReasoning: false } } }
            : {}),
        });
        const inputTokens = result.usage.inputTokens ?? 0;
        const outputTokens = result.usage.outputTokens ?? 0;
        await ctx.runMutation(internal.aiRec.recordUsage, {
          userId: args.userId,
          threadId: args.threadId,
          kind: "describe",
          model: candidate.id,
          inputTokens,
          outputTokens,
          costUsd:
            tokenCostUsd(inputTokens, candidate.pricing.inputPer1M) +
            tokenCostUsd(outputTokens, candidate.pricing.outputPer1M),
          toolCalls: 0,
          durationMs: Date.now() - started,
        });
        const text = result.text.trim();
        if (result.finishReason === "length") {
          if (text.length >= MIN_PARTIAL_CHARS) {
            return { ok: true, modelId: candidate.id, text, truncated: true };
          }
          failures.push(`${candidate.id}: output-limit runaway`);
          break;
        }
        if (text.length === 0) {
          failures.push(`${candidate.id}: empty description`);
          continue;
        }
        return { ok: true, modelId: candidate.id, text, truncated: false };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt === ATTEMPTS_PER_MODEL) {
          failures.push(`${candidate.id}: ${message.slice(0, 200)}`);
        }
      }
    }
  }
  return { ok: false, failures };
}
