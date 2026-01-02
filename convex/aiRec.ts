import { abortStream, listUIMessages, vStreamArgs } from "@convex-dev/agent";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalAction, internalMutation, mutation, query } from "./_generated/server";
import { recommenderAgent } from "./agent";
import { enforceAiRecLimits } from "./rateLimits";

const MAX_PROMPT_LENGTH = 2000;
const TITLE_LENGTH = 60;
const RETENTION_DAYS = 90;
const PRUNE_BATCH = 20;
const USAGE_PAGE = 50;

async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not authenticated");
  }
  return userId;
}

async function currentThread(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"aiRecThreads"> | null> {
  return await ctx.db
    .query("aiRecThreads")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();
}

function titleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > TITLE_LENGTH ? `${trimmed.slice(0, TITLE_LENGTH)}…` : trimmed;
}

export const thread = query({
  args: {},
  handler: async (ctx): Promise<{ threadId: string } | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const row = await currentThread(ctx, userId);
    return row === null ? null : { threadId: row.threadId };
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const owner =
      userId === null
        ? null
        : await ctx.db
            .query("aiRecThreads")
            .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
            .first();
    if (owner === null || owner.userId !== userId) {
      return { page: [], isDone: true, continueCursor: "", streams: undefined };
    }
    const [paginated, streams] = await Promise.all([
      listUIMessages(ctx, components.agent, args),
      recommenderAgent.syncStreams(ctx, { threadId: args.threadId, streamArgs: args.streamArgs }),
    ]);
    return { ...paginated, streams };
  },
});

export const send = mutation({
  args: { text: v.string(), attachmentIds: v.optional(v.array(v.id("aiRecAttachments"))) },
  handler: async (ctx, args): Promise<{ threadId: string; messageId: string }> => {
    const userId = await requireUser(ctx);
    const text = args.text.trim();
    if (
      text.length === 0 &&
      (args.attachmentIds === undefined || args.attachmentIds.length === 0)
    ) {
      throw new ConvexError("Write a message first.");
    }
    if (text.length > MAX_PROMPT_LENGTH) {
      throw new ConvexError(`Keep messages under ${MAX_PROMPT_LENGTH} characters.`);
    }
    await enforceAiRecLimits(ctx, userId);

    let row = await currentThread(ctx, userId);
    if (row === null) {
      const created = await recommenderAgent.createThread(ctx, {
        userId,
        title: titleFromText(text) || "Attachment",
      });
      const id = await ctx.db.insert("aiRecThreads", {
        userId,
        threadId: created.threadId,
        lastActiveAt: Date.now(),
      });
      row = await ctx.db.get("aiRecThreads", id);
    } else {
      await ctx.db.patch("aiRecThreads", row._id, { lastActiveAt: Date.now() });
    }
    if (row === null) {
      throw new ConvexError("Could not open a conversation.");
    }

    const manifest = await attachmentManifest(ctx, userId, row.threadId, args.attachmentIds ?? []);
    const prompt = manifest.length === 0 ? text : `${text}\n\n${manifest}`.trim();

    const { messageId } = await recommenderAgent.saveMessage(ctx, {
      threadId: row.threadId,
      userId,
      prompt,
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.aiRec.stream, {
      threadId: row.threadId,
      userId,
      promptMessageId: messageId,
    });
    return { threadId: row.threadId, messageId };
  },
});

async function attachmentManifest(
  ctx: MutationCtx,
  userId: Id<"users">,
  threadId: string,
  attachmentIds: Id<"aiRecAttachments">[]
): Promise<string> {
  if (attachmentIds.length === 0) {
    return "";
  }
  const rows = await Promise.all(attachmentIds.map((id) => ctx.db.get("aiRecAttachments", id)));
  const owned: Doc<"aiRecAttachments">[] = [];
  for (const row of rows) {
    if (row !== null && row.userId === userId) {
      owned.push(row);
    }
  }
  await Promise.all(owned.map((row) => ctx.db.patch("aiRecAttachments", row._id, { threadId })));
  const lines = owned.map(
    (row) => `- ${row.filename} (${row.mediaType}, ${row.bytes} bytes) id=${row._id}`
  );
  if (lines.length === 0) {
    return "";
  }
  return `[Attached files. You cannot see them directly; call describeMedia with an id to read one, or searchGamesByImage to find games that look like an image.]\n${lines.join("\n")}`;
}

export const newThread = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const userId = await requireUser(ctx);
    const row = await currentThread(ctx, userId);
    if (row === null) {
      return;
    }
    const created = await recommenderAgent.createThread(ctx, { userId });
    await ctx.db.insert("aiRecThreads", {
      userId,
      threadId: created.threadId,
      lastActiveAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { order: v.number() },
  handler: async (ctx, args): Promise<boolean> => {
    const userId = await requireUser(ctx);
    const row = await currentThread(ctx, userId);
    if (row === null) {
      return false;
    }
    return await abortStream(ctx, components.agent, {
      threadId: row.threadId,
      order: args.order,
      reason: "Cancelled by user",
    });
  },
});

export const stream = internalAction({
  args: { threadId: v.string(), userId: v.id("users"), promptMessageId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const result = await recommenderAgent.streamText(
      ctx,
      { threadId: args.threadId, userId: args.userId },
      { promptMessageId: args.promptMessageId },
      { saveStreamDeltas: true }
    );
    await result.consumeStream();
  },
});

export const recordUsage = internalMutation({
  args: {
    userId: v.id("users"),
    threadId: v.string(),
    kind: v.union(v.literal("turn"), v.literal("describe"), v.literal("embed")),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    toolCalls: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.insert("ragUsage", args);
  },
});

export type ThreadUsage = {
  turns: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export const usage = query({
  args: {},
  handler: async (ctx): Promise<ThreadUsage | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const row = await currentThread(ctx, userId);
    if (row === null) {
      return null;
    }
    const rows = await ctx.db
      .query("ragUsage")
      .withIndex("by_thread", (q) => q.eq("threadId", row.threadId))
      .take(USAGE_PAGE);
    return rows.reduce<ThreadUsage>(
      (total, entry) => ({
        turns: total.turns + (entry.kind === "turn" ? 1 : 0),
        inputTokens: total.inputTokens + entry.inputTokens,
        outputTokens: total.outputTokens + entry.outputTokens,
        costUsd: total.costUsd + entry.costUsd,
      }),
      { turns: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
    );
  },
});

export const staleThreads = internalMutation({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const rows = await ctx.db
      .query("aiRecThreads")
      .withIndex("by_lastActiveAt", (q) => q.lt("lastActiveAt", cutoff))
      .take(PRUNE_BATCH);
    const attachmentPages = await Promise.all(
      rows.map((row) =>
        ctx.db
          .query("aiRecAttachments")
          .withIndex("by_thread", (q) => q.eq("threadId", row.threadId))
          .take(PRUNE_BATCH)
      )
    );
    const attachments = attachmentPages.flat();
    await Promise.all([
      ...rows.map((row) => ctx.db.delete("aiRecThreads", row._id)),
      ...attachments.map((attachment) => ctx.storage.delete(attachment.storageId)),
      ...attachments.map((attachment) => ctx.db.delete("aiRecAttachments", attachment._id)),
    ]);
    return rows.map((row) => row.threadId);
  },
});

export const pruneThreads = internalAction({
  args: {},
  handler: async (ctx): Promise<number> => {
    const threadIds: string[] = await ctx.runMutation(internal.aiRec.staleThreads, {});
    await Promise.all(
      threadIds.map((threadId) => recommenderAgent.deleteThreadAsync(ctx, { threadId }))
    );
    return threadIds.length;
  },
});
