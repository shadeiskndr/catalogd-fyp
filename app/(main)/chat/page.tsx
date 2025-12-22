"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { ChatMessageItem } from "@/components/chat/chat-message";
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

const MAX_MESSAGE_LENGTH = 300;

export default function ChatPage() {
  const [draft, setDraft] = useState("");

  const { user } = useCurrentUser();
  const { messages, isLoading } = useMessages();

  const sendMessage = useMutation(api.messages.send);
  const removeMessage = useMutation(api.messages.remove);

  const currentUserId = user?._id;

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

  return (
    <div className="space-y-4 px-2 pt-4">
      <h1 className="font-bold text-3xl">Chat Room</h1>
      <div className="mx-auto flex h-230 w-full max-w-5xl flex-col rounded-lg border shadow-lg">
        <Conversation className="flex-1">
          <ConversationContent>
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="size-8 text-primary" />
              </div>
            ) : null}
            {!isLoading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                No messages yet. Start a conversation!
              </div>
            ) : null}
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwn={message.userId === currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={draft}
              onChange={handleDraftChange}
              placeholder="Write your message..."
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <PromptInputToolbar>
              <span />
              <PromptInputSubmit title="Send Message" />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
