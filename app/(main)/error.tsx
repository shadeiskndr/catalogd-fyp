"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            We could not load this page. The game database may be busy — trying again usually works.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={handleRetry} className="gap-1.5 active:scale-[0.98]">
              <RefreshCw className="size-4" />
              <span>Try again</span>
            </Button>
            <Button asChild variant="outline" className="active:scale-[0.98]">
              <Link href="/dashboard" prefetch>
                Back to dashboard
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
