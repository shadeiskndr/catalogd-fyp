"use client";

import { ConvexError } from "convex/values";
import { MessageSquarePlus } from "lucide-react";
import { type ChangeEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { AiRecEmptyState } from "@/components/ai-rec/ai-rec-empty-state";
import { AiRecMessageItem } from "@/components/ai-rec/ai-rec-message";
import { AiRecSubmit } from "@/components/ai-rec/ai-rec-submit";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/conversation";
import type { PromptInputError } from "@/components/ui/shadcn-io/prompt-input";
import {
  PromptInput,
  PromptInputAttachButton,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ui/shadcn-io/prompt-input";
import type {
  PromptInputFile,
  PromptInputMessage,
} from "@/components/ui/shadcn-io/prompt-input-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiRecConversation } from "@/hooks/use-ai-rec";
import { useAiRecAttachments } from "@/hooks/use-ai-rec-attachments";
import { ACCEPT_ATTRIBUTE, MAX_ATTACHMENTS, VIDEO_MAX_BYTES } from "@/lib/media-types";

const MAX_PROMPT_LENGTH = 2000;

type RateLimitData = { code: "rate_limited"; retryAfterSeconds: number };

function renderAttachment(file: PromptInputFile) {
  return <PromptInputAttachment key={file.id} data={file} />;
}

function isRateLimit(data: unknown): data is RateLimitData {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    (data as { code: unknown }).code === "rate_limited"
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    if (isRateLimit(error.data)) {
      return `Too many requests. Try again in ${error.data.retryAfterSeconds}s.`;
    }
    if (typeof error.data === "string") {
      return error.data;
    }
  }
  return "The recommender could not take that message.";
}

function MessagesSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-5" aria-busy="true">
      <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
      <Skeleton className="h-24 w-4/5 rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <span className="sr-only">Loading conversation</span>
    </div>
  );
}

export function AiRecConversationSkeleton() {
  return (
    <div className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <MessagesSkeleton />
      <div className="shrink-0 border-t p-3 md:p-4">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AiRecConversation() {
  const { messages, status, usage, isLoadingThread, send, stop, startNewThread } =
    useAiRecConversation();
  const { upload, isUploading } = useAiRecAttachments();
  const [draft, setDraft] = useState("");
  const [formKey, setFormKey] = useState(0);

  const isBusy = status === "submitted" || status === "streaming" || isUploading;
  const isEmpty = messages.length === 0;

  const submitText = useCallback(
    async (text: string, files: PromptInputFile[] = []) => {
      const trimmed = text.trim();
      if (trimmed.length === 0 && files.length === 0) {
        toast.error("Write a message first.");
        return;
      }
      if (isBusy) {
        return;
      }
      try {
        const attachmentIds = await upload(files.map((file) => file.file));
        await send(trimmed, attachmentIds);
        setDraft("");
        setFormKey((key) => key + 1);
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    [isBusy, send, upload]
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      void submitText(message.text, message.files);
    },
    [submitText]
  );

  const handleAttachmentError = useCallback((error: PromptInputError) => {
    toast.error(error.message);
  }, []);

  const handleSuggestion = useCallback(
    (text: string) => {
      void submitText(text);
    },
    [submitText]
  );

  const handleDraftChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(event.target.value);
  }, []);

  const handleNewThread = useCallback(() => {
    void startNewThread();
  }, [startNewThread]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const lastMessage = messages.at(-1);

  return (
    <div className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      {isLoadingThread ? <MessagesSkeleton /> : null}
      {!isLoadingThread && isEmpty ? <AiRecEmptyState onSuggestion={handleSuggestion} /> : null}
      {!isLoadingThread && !isEmpty ? (
        <Conversation className="flex-1">
          <ConversationContent className="flex min-h-full flex-col justify-end gap-2 p-4 md:p-5">
            {messages.map((message) => (
              <AiRecMessageItem
                key={message.key}
                message={message}
                isStreaming={status === "streaming" && message.id === lastMessage?.id}
                isLast={message.id === lastMessage?.id}
              />
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      ) : null}

      <div className="shrink-0 space-y-2 border-t p-3 md:p-4">
        <PromptInput
          key={formKey}
          onSubmit={handleSubmit}
          onError={handleAttachmentError}
          accept={ACCEPT_ATTRIBUTE}
          multiple
          maxFiles={MAX_ATTACHMENTS}
          maxFileSize={VIDEO_MAX_BYTES}
          className="rounded-xl"
        >
          <PromptInputHeader>
            <PromptInputAttachments className="p-0">{renderAttachment}</PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              value={draft}
              onChange={handleDraftChange}
              placeholder="Describe the game you want, name one you loved, or attach a screenshot..."
              maxLength={MAX_PROMPT_LENGTH}
              aria-label="Message the recommender"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputAttachButton
                disabled={isBusy}
                title="Attach a screenshot, clip or voice note"
              />
              {isEmpty ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleNewThread}
                  disabled={isBusy}
                  className="gap-1.5 text-muted-foreground active:scale-[0.97]"
                >
                  <MessageSquarePlus className="size-4" />
                  <span>New conversation</span>
                </Button>
              )}
            </PromptInputTools>
            <div className="flex items-center gap-3">
              {usage !== null && usage.turns > 0 ? (
                <span
                  className="hidden text-muted-foreground text-xs tabular-nums sm:inline"
                  title={`${usage.inputTokens} input and ${usage.outputTokens} output tokens over ${usage.turns} model calls`}
                >
                  ${usage.costUsd.toFixed(4)} this conversation
                </span>
              ) : null}
              <AiRecSubmit draft={draft} status={status} isBusy={isBusy} onStop={handleStop} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
