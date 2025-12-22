"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/shadcn-io/message";
import type { Id } from "@/convex/_generated/dataModel";
import type { ChatMessage } from "@/hooks/use-messages";

type ChatMessageItemProps = {
  message: ChatMessage;
  isOwn: boolean;
  onDelete: (id: Id<"messages">) => void;
};

export function ChatMessageItem({ message, isOwn, onDelete }: ChatMessageItemProps) {
  const [sentAt, setSentAt] = useState("");

  useEffect(() => {
    setSentAt(new Date(message.createdAt).toLocaleString());
  }, [message.createdAt]);

  const handleDelete = useCallback(() => {
    onDelete(message.id);
  }, [message.id, onDelete]);

  return (
    <Message from={isOwn ? "user" : "assistant"} className="group">
      <div className="flex flex-col gap-1">
        <MessageContent>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="mb-1 font-semibold text-xs">{message.userName}</p>
              <p className="wrap-break-word">{message.message}</p>
            </div>
            {isOwn ? (
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="icon-sm"
                aria-label="Delete message"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </MessageContent>
        <p className="px-4 text-xs">{sentAt}</p>
      </div>
    </Message>
  );
}
