"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-destructive">Something went wrong loading this page.</p>
      <Button onClick={handleRetry} variant="outline">
        Try again
      </Button>
    </div>
  );
}
