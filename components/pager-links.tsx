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
    <div className="flex items-center justify-center gap-3 pt-4">
      {hasPrevious ? (
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href={`${basePath}?page=${page - 1}`} prefetch>
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </Link>
        </Button>
      ) : null}
      {hasMore ? (
        <Button asChild size="lg" className="gap-2">
          <Link href={`${basePath}?page=${page + 1}`} prefetch>
            <span>Next</span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
