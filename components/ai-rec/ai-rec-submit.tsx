"use client";

import type { ChatStatus } from "ai";
import { PromptInputSubmit } from "@/components/ui/shadcn-io/prompt-input";
import { usePromptInputAttachments } from "@/components/ui/shadcn-io/prompt-input-context";

type AiRecSubmitProps = {
  draft: string;
  status: ChatStatus;
  isBusy: boolean;
  onStop: () => void;
};

export function AiRecSubmit({ draft, status, isBusy, onStop }: AiRecSubmitProps) {
  const attachments = usePromptInputAttachments();
  const hasContent = draft.trim().length > 0 || attachments.files.length > 0;

  return (
    <PromptInputSubmit
      title={isBusy ? "Stop" : "Send"}
      status={status}
      type={isBusy ? "button" : "submit"}
      {...(isBusy ? { onClick: onStop } : {})}
      disabled={!isBusy && !hasContent}
      className="active:scale-90"
    />
  );
}
