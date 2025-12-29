import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PagerLinksProps = {
  basePath: string;
  page: number;
  hasMore: boolean;
};

export function PagerLinks({ basePath, page, hasMore }: PagerLinksProps) {
  const hasPrevious = page > 1;

  if (!(hasPrevious || hasMore)) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-10">
      {hasPrevious ? (
        <Button asChild variant="outline" className="gap-1.5 active:scale-[0.98]">
          <Link href={`${basePath}?page=${page - 1}`} prefetch>
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </Link>
        </Button>
      ) : (
        <Button variant="outline" className="gap-1.5" disabled>
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </Button>
      )}

      <span
        aria-current="page"
        className="min-w-24 text-center text-muted-foreground text-sm tabular-nums"
      >
        Page {page}
      </span>

      {hasMore ? (
        <Button asChild variant="outline" className="gap-1.5 active:scale-[0.98]">
          <Link href={`${basePath}?page=${page + 1}`} prefetch>
            <span>Next</span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" className="gap-1.5" disabled>
          <span>Next</span>
          <ChevronRight className="size-4" />
        </Button>
      )}
    </nav>
  );
}
