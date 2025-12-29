import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      <div className="space-y-2 pt-6 pb-5">
        <Skeleton className="h-8 w-56 rounded-full" />
        <Skeleton className="h-4 w-80 rounded-full" />
      </div>
      <GameGridSkeleton count={8} />
      <span className="sr-only">Loading</span>
    </>
  );
}
