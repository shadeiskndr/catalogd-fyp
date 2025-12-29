import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type LoadMoreProps = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  label?: string;
};

export function LoadMore({ hasMore, isLoading, onLoadMore, label = "Load more" }: LoadMoreProps) {
  if (!hasMore) {
    return null;
  }

  const buttonLabel = isLoading ? "Loading" : label;

  return (
    <div className="flex items-center justify-center pt-10">
      <Button
        onClick={onLoadMore}
        variant="outline"
        disabled={isLoading}
        className="min-w-40 gap-1.5 active:scale-[0.98]"
      >
        {isLoading ? <Spinner className="size-4" /> : <ChevronDown className="size-4" />}
        <span>{buttonLabel}</span>
      </Button>
    </div>
  );
}
