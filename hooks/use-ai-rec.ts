"use client";

import { useUIMessages } from "@convex-dev/agent/react";
import type { ChatStatus } from "ai";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const INITIAL_MESSAGES = 50;

export function useAiRecConversation() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const thread = useQuery(api.aiRec.thread, isAuthenticated ? {} : "skip");
  const threadId = thread?.threadId;
  const usage = useQuery(api.aiRec.usage, isAuthenticated ? {} : "skip");

  const { results: messages, status: listStatus } = useUIMessages(
    api.aiRec.listMessages,
    threadId === undefined ? "skip" : { threadId },
    { initialNumItems: INITIAL_MESSAGES, stream: true }
  );

  const sendMutation = useMutation(api.aiRec.send);
  const cancelMutation = useMutation(api.aiRec.cancel);
  const newThreadMutation = useMutation(api.aiRec.newThread);
  const [pending, setPending] = useState(false);

  const lastMessage = messages.at(-1);
  const streaming = messages.some((message) => message.status === "streaming");
  const status: ChatStatus = streaming
    ? "streaming"
    : pending || lastMessage?.status === "pending"
      ? "submitted"
      : lastMessage?.status === "failed"
        ? "error"
        : "ready";

  const send = useCallback(
    async (text: string, attachmentIds: Id<"aiRecAttachments">[] = []) => {
      setPending(true);
      try {
        await sendMutation({
          text,
          ...(attachmentIds.length === 0 ? {} : { attachmentIds }),
        });
      } finally {
        setPending(false);
      }
    },
    [sendMutation]
  );

  const stop = useCallback(() => {
    if (lastMessage === undefined) {
      return;
    }
    void cancelMutation({ order: lastMessage.order });
  }, [cancelMutation, lastMessage]);

  const startNewThread = useCallback(async () => {
    await newThreadMutation({});
  }, [newThreadMutation]);

  return {
    messages,
    status,
    usage: usage ?? null,
    isLoadingThread:
      isAuthLoading ||
      (isAuthenticated &&
        (thread === undefined || (threadId !== undefined && listStatus === "LoadingFirstPage"))),
    hasThread: threadId !== undefined,
    send,
    stop,
    startNewThread,
  };
}
