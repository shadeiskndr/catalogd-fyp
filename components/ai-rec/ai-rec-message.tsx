"use client";

import type { UIMessage } from "@convex-dev/agent/react";
import { type DynamicToolUIPart, isToolUIPart, type ToolUIPart } from "ai";
import { ToolGamesGrid } from "@/components/ai-rec/tool-games-grid";
import { Message, MessageContent } from "@/components/ui/shadcn-io/message";
import { Response } from "@/components/ui/shadcn-io/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ui/shadcn-io/tool";

type AnyToolPart = ToolUIPart | DynamicToolUIPart;

const TOOL_TITLES: Record<string, string> = {
  searchGames: "Searching the catalogue",
  similarToGame: "Finding similar games",
  myTaste: "Reading your taste",
  addToList: "Updating your list",
  describeMedia: "Looking at the attachment",
  searchGamesByImage: "Searching by image",
};

const GAME_TOOLS = new Set(["searchGames", "similarToGame", "myTaste", "searchGamesByImage"]);

function toolName(part: AnyToolPart): string {
  return part.type === "dynamic-tool" ? part.toolName : part.type.replace(/^tool-/, "");
}

function rawgIdsOf(output: unknown): number[] | null {
  if (typeof output !== "object" || output === null || !("rawgIds" in output)) {
    return null;
  }
  const ids = (output as { rawgIds: unknown }).rawgIds;
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === "number") : null;
}

function ToolPart({ part, eager }: { part: AnyToolPart; eager: boolean }) {
  const name = toolName(part);
  const isGameTool = GAME_TOOLS.has(name);
  const rawgIds = part.state === "output-available" ? rawgIdsOf(part.output) : null;
  const errorText = part.state === "output-error" ? part.errorText : undefined;

  return (
    <div className="space-y-3">
      <Tool>
        <ToolHeader title={TOOL_TITLES[name] ?? name} type={`tool-${name}`} state={part.state} />
        <ToolContent>
          <ToolInput input={part.input} />
          {isGameTool && rawgIds !== null ? null : (
            <ToolOutput
              output={part.state === "output-available" ? part.output : undefined}
              errorText={errorText}
            />
          )}
        </ToolContent>
      </Tool>
      {isGameTool && rawgIds !== null ? <ToolGamesGrid rawgIds={rawgIds} eager={eager} /> : null}
    </div>
  );
}

export function AiRecMessageItem({
  message,
  isStreaming,
  isLast,
}: {
  message: UIMessage;
  isStreaming: boolean;
  isLast: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    const raw = message.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n");
    const manifestStart = raw.indexOf("[Attached files.");
    const text = (manifestStart === -1 ? raw : raw.slice(0, manifestStart)).trim();
    const attachmentCount =
      manifestStart === -1
        ? 0
        : raw
            .slice(manifestStart)
            .split("\n")
            .filter((line) => line.startsWith("- ")).length;
    return (
      <Message from="user" className="py-2">
        <MessageContent>
          <p className="wrap-break-word whitespace-pre-wrap">{text}</p>
          {attachmentCount > 0 ? (
            <p className="text-primary-foreground/70 text-xs">
              {attachmentCount} attachment{attachmentCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </MessageContent>
      </Message>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 py-2">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (part.type === "text") {
          if (part.text.trim().length === 0) {
            return null;
          }
          return (
            <Message from="assistant" key={key} className="py-0">
              <MessageContent className="max-w-none">
                <Response isAnimating={isStreaming}>{part.text}</Response>
              </MessageContent>
            </Message>
          );
        }
        if (part.type === "dynamic-tool" || isToolUIPart(part)) {
          return <ToolPart key={key} part={part} eager={isLast} />;
        }
        return null;
      })}
      {message.status === "failed" ? (
        <p className="text-destructive text-sm">
          The recommender could not finish this reply. Try sending your message again.
        </p>
      ) : null}
    </div>
  );
}
