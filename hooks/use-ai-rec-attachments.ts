"use client";

import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { normalizeImage } from "@/lib/normalize-image";

export function useAiRecAttachments() {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const registerAttachment = useMutation(api.media.registerAttachment);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (files: File[]): Promise<Id<"aiRecAttachments">[]> => {
      if (files.length === 0) {
        return [];
      }
      setIsUploading(true);
      try {
        const normalized = await Promise.all(files.map((file) => normalizeImage(file)));
        return await Promise.all(
          normalized.map(async (file) => {
            const uploadUrl = await generateUploadUrl({});
            const response = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (!response.ok) {
              throw new Error(`Upload failed with ${response.status}`);
            }
            const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
            return await registerAttachment({
              storageId,
              filename: file.name,
              mediaType: file.type,
            });
          })
        );
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, registerAttachment]
  );

  return { upload, isUploading };
}
