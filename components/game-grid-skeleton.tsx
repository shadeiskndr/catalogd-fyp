import { GAME_GRID_CLASSES } from "@/components/game-grid-classes";
import { Skeleton } from "@/components/ui/skeleton";

export function GameGridSkeleton({ count = 12 }: { count?: number }) {
  const placeholders = Array.from({ length: count }, (_, index) => `game-skeleton-${index}`);

  return (
    <div className={GAME_GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <div
          key={placeholder}
          className="flex flex-col gap-0 overflow-hidden rounded-xl border bg-card"
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4 pt-3">
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
