import { Suspense } from "react";
import { Banner } from "@/components/game/banner";
import { Info } from "@/components/game/info";
import { ReviewsSection } from "@/components/game/reviews-section";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, Screenshot } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

type Params = Promise<{ slug: string }>;

function GameDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="-mx-4 space-y-4 bg-muted/40 px-4 pt-24 pb-8 md:-mx-6 md:px-6 md:pt-36">
        <Skeleton className="h-11 w-2/3 max-w-xl rounded-full" />
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="aspect-video rounded-lg" />
      </div>
    </div>
  );
}

async function GameDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const [game, screenshots] = await Promise.all([
    rawgFetchServer<Game>(`games/${slug}`),
    rawgFetchServer<Screenshot>(`games/${slug}/screenshots`),
  ]);

  return (
    <>
      <Banner game={game} />
      <Info game={game} screenshots={screenshots.results} />
      <ReviewsSection gameName={game.name} />
    </>
  );
}

export default function GamePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<GameDetailSkeleton />}>
      <GameDetail params={params} />
    </Suspense>
  );
}
