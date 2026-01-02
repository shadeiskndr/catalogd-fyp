"use client";

import type { ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("not-prose group w-full rounded-lg border bg-card/60", className)}
    {...props}
  />
);

type ToolState = ToolUIPart["state"];

const STATUS_LABELS: Record<string, string> = {
  "input-streaming": "Pending",
  "input-available": "Running",
  "approval-requested": "Awaiting approval",
  "approval-responded": "Responded",
  "output-available": "Completed",
  "output-error": "Error",
  "output-denied": "Denied",
};

function statusIcon(state: ToolState): ReactNode {
  switch (state) {
    case "input-streaming":
      return <CircleIcon className="size-3.5" />;
    case "input-available":
      return <ClockIcon className="size-3.5 animate-pulse" />;
    case "output-available":
      return <CheckCircleIcon className="size-3.5 text-primary" />;
    case "output-error":
    case "output-denied":
      return <XCircleIcon className="size-3.5 text-destructive" />;
    default:
      return <ClockIcon className="size-3.5" />;
  }
}

export type ToolHeaderProps = {
  title?: string;
  type: ToolUIPart["type"];
  state: ToolState;
  className?: string;
};

export const ToolHeader = ({ className, title, type, state, ...props }: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-full items-center justify-between gap-4 rounded-lg p-3 text-left transition-colors duration-150 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      className
    )}
    {...props}
  >
    <div className="flex min-w-0 items-center gap-2">
      <WrenchIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium text-sm">
        {title ?? type.split("-").slice(1).join("-")}
      </span>
      <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
        {statusIcon(state)}
        {STATUS_LABELS[state] ?? state}
      </Badge>
    </div>
    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out-strong group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 border-t text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
      {JSON.stringify(input, null, 2)}
    </pre>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolUIPart["output"];
  errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
  if (output === undefined && errorText === undefined) {
    return null;
  }
  const body =
    typeof output === "string"
      ? output
      : output === undefined
        ? null
        : JSON.stringify(output, null, 2);
  return (
    <div className={cn("space-y-2 p-4", className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText === undefined ? "Result" : "Error"}
      </h4>
      <pre
        className={cn(
          "overflow-x-auto whitespace-pre-wrap rounded-md p-3 font-mono text-xs",
          errorText === undefined
            ? "bg-muted/50 text-foreground"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {errorText ?? body}
      </pre>
    </div>
  );
};
