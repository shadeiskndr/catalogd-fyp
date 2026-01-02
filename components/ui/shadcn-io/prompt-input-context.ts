import { createContext, useContext } from "react";

export type PromptInputFile = {
  id: string;
  file: File;
  url: string;
  mediaType: string;
  filename: string;
};

export type PromptInputMessage = {
  text: string;
  files: PromptInputFile[];
};

export type PromptInputAttachmentsValue = {
  files: PromptInputFile[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
};

export const PromptInputAttachmentsContext = createContext<PromptInputAttachmentsValue | null>(
  null
);

export function usePromptInputAttachments(): PromptInputAttachmentsValue {
  const context = useContext(PromptInputAttachmentsContext);
  if (context === null) {
    throw new Error("usePromptInputAttachments must be used within a PromptInput");
  }
  return context;
}
