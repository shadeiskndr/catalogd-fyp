import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoadMoreProps = {
  page?: number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onLoadPrevious?: () => void;
};

export function LoadMore({
  page = 0,
  hasMore,
  isLoading,
  onLoadMore,
  onLoadPrevious,
}: LoadMoreProps) {
  if (isLoading) return null;

  const hasPrevious = page > 1 && onLoadPrevious !== undefined;

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      {hasPrevious ? (
        <Button onClick={onLoadPrevious} variant="outline" size="lg" className="gap-2">
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </Button>
      ) : null}
      {hasMore ? (
        <Button onClick={onLoadMore} size="lg" className="gap-2">
          <span>Next</span>
          <ChevronRight className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
