"use client";

import type { ChatStatus } from "ai";
import { CornerDownLeftIcon, Loader2Icon, PaperclipIcon, SquareIcon, XIcon } from "lucide-react";
import { nanoid } from "nanoid";
import Image from "next/image";
import {
  type ChangeEventHandler,
  Children,
  type ClipboardEventHandler,
  type ComponentProps,
  type FormEvent,
  type FormEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  PromptInputAttachmentsContext,
  type PromptInputAttachmentsValue,
  type PromptInputFile,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/components/ui/shadcn-io/prompt-input-context";
import { cn } from "@/lib/utils";

export type PromptInputError = {
  code: "max_files" | "max_file_size" | "accept";
  message: string;
};

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onError"> & {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  onError?: (error: PromptInputError) => void;
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void;
};

function matchesAccept(accept: string | undefined, file: File): boolean {
  if (accept === undefined || accept.trim() === "") {
    return true;
  }
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length > 0);
  return patterns.some((pattern) =>
    pattern.endsWith("/*") ? file.type.startsWith(pattern.slice(0, -1)) : file.type === pattern
  );
}

export const PromptInput = ({
  className,
  accept,
  multiple,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [files, setFiles] = useState<PromptInputFile[]>([]);
  const filesRef = useRef<PromptInputFile[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(
    () => () => {
      for (const file of filesRef.current) {
        URL.revokeObjectURL(file.url);
      }
    },
    []
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const add = useCallback(
    (incoming: File[] | FileList) => {
      const list = Array.from(incoming);
      const accepted = list.filter((file) => matchesAccept(accept, file));
      if (list.length > 0 && accepted.length === 0) {
        onError?.({ code: "accept", message: "That file type is not supported." });
        return;
      }
      const sized = accepted.filter((file) =>
        maxFileSize === undefined ? true : file.size <= maxFileSize
      );
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({ code: "max_file_size", message: "That file is too large." });
        return;
      }
      const capacity =
        maxFiles === undefined ? sized.length : Math.max(0, maxFiles - filesRef.current.length);
      const capped = sized.slice(0, capacity);
      if (sized.length > capped.length) {
        onError?.({ code: "max_files", message: "Too many files. Some were not added." });
      }
      const next = capped.map((file) => ({
        id: nanoid(),
        file,
        // react-doctor-disable-next-line react-doctor/no-create-object-url-without-revoke
        url: URL.createObjectURL(file),
        mediaType: file.type,
        filename: file.name,
      }));
      setFiles(filesRef.current.concat(next));
    },
    [accept, maxFileSize, maxFiles, onError]
  );

  const remove = useCallback((id: string) => {
    const found = filesRef.current.find((file) => file.id === id);
    if (found !== undefined) {
      URL.revokeObjectURL(found.url);
    }
    setFiles(filesRef.current.filter((file) => file.id !== id));
  }, []);

  const clear = useCallback(() => {
    for (const file of filesRef.current) {
      URL.revokeObjectURL(file.url);
    }
    setFiles([]);
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (form === null) {
      return;
    }
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
      }
    };
    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
      }
      if (event.dataTransfer !== null && event.dataTransfer.files.length > 0) {
        add(event.dataTransfer.files);
      }
    };
    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [add]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.currentTarget.files !== null) {
        add(event.currentTarget.files);
      }
      event.currentTarget.value = "";
    },
    [add]
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const message = formData.get("message");
      onSubmit(
        { text: typeof message === "string" ? message : "", files: filesRef.current },
        event
      );
    },
    [onSubmit]
  );

  const context = useMemo<PromptInputAttachmentsValue>(
    () => ({ files, add, remove, clear, openFileDialog }),
    [files, add, remove, clear, openFileDialog]
  );

  return (
    <PromptInputAttachmentsContext.Provider value={context}>
      <input
        {...(accept === undefined ? {} : { accept })}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <form className={cn("w-full", className)} onSubmit={handleSubmit} ref={formRef} {...props}>
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </PromptInputAttachmentsContext.Provider>
  );
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({ className, ...props }: PromptInputBodyProps) => (
  <div className={cn("contents", className)} {...props} />
);

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

export const PromptInputTextarea = ({
  className,
  placeholder = "What would you like to know?",
  ...props
}: PromptInputTextareaProps) => {
  const attachments = usePromptInputAttachments();
  const composingRef = useRef(false);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        if (composingRef.current || event.nativeEvent.isComposing) {
          return;
        }
        event.preventDefault();
        const form = event.currentTarget.form;
        const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submit?.disabled === true) {
          return;
        }
        form?.requestSubmit();
        return;
      }
      if (
        event.key === "Backspace" &&
        event.currentTarget.value === "" &&
        attachments.files.length > 0
      ) {
        event.preventDefault();
        const last = attachments.files.at(-1);
        if (last !== undefined) {
          attachments.remove(last.id);
        }
      }
    },
    [attachments]
  );

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const files: File[] = [];
      for (const item of event.clipboardData.items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file !== null) {
            files.push(file);
          }
        }
      }
      if (files.length > 0) {
        event.preventDefault();
        attachments.add(files);
      }
    },
    [attachments]
  );

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-16", className)}
      name="message"
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder}
      {...props}
    />
  );
};

export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroupAddon>, "align">;

export const PromptInputHeader = ({ className, ...props }: PromptInputHeaderProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("order-first flex-wrap gap-1", className)}
    {...props}
  />
);

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, "align">;

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("justify-between gap-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props} />
);

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const resolvedSize = size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm");
  return (
    <InputGroupButton
      className={cn(className)}
      size={resolvedSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputAttachButtonProps = Omit<PromptInputButtonProps, "onClick">;

export const PromptInputAttachButton = ({
  children,
  className,
  ...props
}: PromptInputAttachButtonProps) => {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      aria-label="Add attachment"
      className={className}
      onClick={attachments.openFileDialog}
      {...props}
    >
      {children ?? <PaperclipIcon className="size-4" />}
    </PromptInputButton>
  );
};

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: PromptInputFile;
};

export const PromptInputAttachment = ({
  data,
  className,
  ...props
}: PromptInputAttachmentProps) => {
  const attachments = usePromptInputAttachments();
  const isImage = data.mediaType.startsWith("image/");
  const label = data.filename.length > 0 ? data.filename : isImage ? "Image" : "Attachment";

  const handleRemove = useCallback(() => {
    attachments.remove(data.id);
  }, [attachments, data.id]);

  return (
    <div
      className={cn(
        "group relative flex h-8 select-none items-center gap-1.5 rounded-md border border-border px-1.5 font-medium text-sm",
        className
      )}
      {...props}
    >
      <div className="relative size-5 shrink-0 overflow-hidden rounded bg-muted">
        {isImage ? (
          <Image
            alt={label}
            className="size-5 object-cover"
            height={20}
            src={data.url}
            unoptimized
            width={20}
          />
        ) : (
          <PaperclipIcon className="size-5 p-1 text-muted-foreground" />
        )}
      </div>
      <span className="max-w-40 flex-1 truncate">{label}</span>
      <Button
        aria-label={`Remove ${label}`}
        className="size-5 rounded-full text-muted-foreground active:scale-90 [&>svg]:size-3"
        onClick={handleRemove}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <XIcon />
      </Button>
    </div>
  );
};

export type PromptInputAttachmentsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: (attachment: PromptInputFile) => ReactNode;
};

export const PromptInputAttachments = ({
  children,
  className,
  ...props
}: PromptInputAttachmentsProps) => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-2 p-3", className)} {...props}>
      {attachments.files.map((file) => children(file))}
    </div>
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let icon = <CornerDownLeftIcon className="size-4" />;
  if (status === "submitted") {
    icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    icon = <XIcon className="size-4" />;
  }
  return (
    <InputGroupButton
      aria-label="Submit"
      className={cn(className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? icon}
    </InputGroupButton>
  );
};
