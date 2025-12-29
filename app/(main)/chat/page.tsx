"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { MessageCircle } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { ChatMessageItem } from "@/components/chat/chat-message";
import { PageHeader } from "@/components/layout/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/conversation";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ui/shadcn-io/prompt-input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMessages } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 300;
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function ChatPage() {
  const [draft, setDraft] = useState("");

  const { user } = useCurrentUser();
  const { messages, isLoading } = useMessages();

  const sendMessage = useMutation(api.messages.send);
  const removeMessage = useMutation(api.messages.remove);

  const currentUserId = user?._id;
  const remaining = MAX_MESSAGE_LENGTH - draft.length;

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (draft.trim().length === 0) {
        toast.error("Message cannot be empty.");
        return;
      }

      try {
        await sendMessage({ body: draft });
        setDraft("");
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(
          error instanceof ConvexError && typeof error.data === "string"
            ? error.data
            : "Error sending message."
        );
      }
    },
    [draft, sendMessage]
  );

  const handleDelete = useCallback(
    async (messageId: Id<"messages">) => {
      try {
        await removeMessage({ id: messageId });
        toast.success("Message deleted successfully!");
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error("Error deleting message.");
      }
    },
    [removeMessage]
  );

  const isEmpty = !isLoading && messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Chat Room"
        description="One shared room for everyone using Catalogd. Say hello."
      />

      <div className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : null}

        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle />
                </EmptyMedia>
                <EmptyTitle>No messages yet</EmptyTitle>
                <EmptyDescription>
                  Start the conversation — ask what everyone is playing this week.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : null}

        {!(isLoading || isEmpty) ? (
          <Conversation className="flex-1">
            <ConversationContent className="flex min-h-full flex-col justify-end p-4 md:p-5">
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const showAuthor =
                  previous === undefined ||
                  previous.userId !== message.userId ||
                  message.createdAt - previous.createdAt > GROUP_WINDOW_MS;

                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.userId === currentUserId}
                    showAuthor={showAuthor}
                    onDelete={handleDelete}
                  />
                );
              })}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        ) : null}

        <div className="shrink-0 border-t p-3 md:p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={draft}
              onChange={handleDraftChange}
              placeholder="Write your message..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="min-h-16"
            />
            <PromptInputToolbar>
              {draft.length === 0 ? (
                <span />
              ) : (
                <span
                  className={cn(
                    "px-2 text-xs tabular-nums",
                    remaining <= 30 ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {remaining} left
                </span>
              )}
              <PromptInputSubmit
                title="Send Message"
                disabled={draft.trim().length === 0}
                className="active:scale-90"
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
