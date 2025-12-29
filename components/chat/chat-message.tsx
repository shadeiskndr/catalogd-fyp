"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import type { ChatMessage } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";

type ChatMessageItemProps = {
  message: ChatMessage;
  isOwn: boolean;
  showAuthor: boolean;
  onDelete: (id: Id<"messages">) => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ChatMessageItem({ message, isOwn, showAuthor, onDelete }: ChatMessageItemProps) {
  const [sentAt, setSentAt] = useState("");

  useEffect(() => {
    setSentAt(
      new Date(message.createdAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, [message.createdAt]);

  const handleDelete = useCallback(() => {
    onDelete(message.id);
  }, [message.id, onDelete]);

  return (
    <div
      className={cn("flex w-full gap-2.5", showAuthor ? "mt-4 first:mt-0" : "mt-0.5", {
        "flex-row-reverse": isOwn,
      })}
    >
      {showAuthor ? (
        <Avatar className="size-8 shrink-0 ring-1 ring-border">
          <AvatarFallback className="bg-secondary font-medium text-secondary-foreground text-xs">
            {initials(message.userName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div aria-hidden="true" className="size-8 shrink-0" />
      )}

      <div
        className={cn("flex min-w-0 max-w-[85%] flex-col gap-1 sm:max-w-[70%]", {
          "items-end": isOwn,
        })}
      >
        {showAuthor ? (
          <p className="flex items-baseline gap-1.5 px-1 text-muted-foreground text-xs">
            <span className="font-medium text-foreground">{isOwn ? "You" : message.userName}</span>
            <time className="tabular-nums" dateTime={new Date(message.createdAt).toISOString()}>
              {sentAt}
            </time>
          </p>
        ) : null}

        <div className={cn("group/bubble flex items-center gap-1", { "flex-row-reverse": isOwn })}>
          <div
            className={cn(
              "min-w-0 rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              isOwn
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md bg-secondary text-secondary-foreground"
            )}
          >
            <p className="wrap-break-word whitespace-pre-wrap">{message.message}</p>
          </div>
          {isOwn ? (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon-sm"
              aria-label="Delete message"
              className="shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform,color] duration-150 ease-out hover:text-destructive focus-visible:opacity-100 active:scale-90 group-hover/bubble:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
