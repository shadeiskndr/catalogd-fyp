"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CLAMP_THRESHOLD = 640;

export function GameDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClampable = text.length > CLAMP_THRESHOLD;

  const toggle = useCallback(() => {
    setIsExpanded((current) => !current);
  }, []);

  if (text.length === 0) {
    return <p className="text-muted-foreground text-sm">No description available.</p>;
  }

  return (
    <div className="space-y-2">
      <p
        className={cn(
          "whitespace-pre-line text-sm leading-relaxed sm:text-base",
          isClampable && !isExpanded ? "line-clamp-6" : ""
        )}
      >
        {text}
      </p>
      {isClampable ? (
        <Button
          variant="link"
          onClick={toggle}
          aria-expanded={isExpanded}
          className="h-auto p-0 text-sm"
        >
          {isExpanded ? "Show less" : "Read more"}
        </Button>
      ) : null}
    </div>
  );
}
