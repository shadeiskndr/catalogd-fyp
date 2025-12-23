import { Skeleton } from "@/components/ui/skeleton";

export function GameGridSkeleton({ count = 10 }: { count?: number }) {
  const placeholders = Array.from({ length: count }, (_, index) => `game-skeleton-${index}`);

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {placeholders.map((placeholder) => (
        <Skeleton key={placeholder} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}
