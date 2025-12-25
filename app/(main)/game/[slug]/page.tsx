import Image from "next/image";
import { Suspense } from "react";
import { Banner } from "@/components/game/banner";
import { Info } from "@/components/game/info";
import { ReviewsSection } from "@/components/game/reviews-section";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, Screenshot } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";
import { rawgFetchServer } from "@/lib/rawg-server";

type Params = Promise<{ slug: string }>;

function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-80 w-full" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <Skeleton className="h-60 flex-1" />
        <Skeleton className="h-60 lg:w-96" />
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
    <div>
      {game.background_image.length > 0 ? (
        <div className="pointer-events-none fixed inset-0 z-0 opacity-20 blur-sm">
          <Image
            src={rawgImage(game.background_image, 640)}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <Banner game={game} />
      <Info game={game} screenshots={screenshots.results} />
      <ReviewsSection gameName={game.name} />
    </div>
  );
}

export default function GamePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<GameDetailSkeleton />}>
      <GameDetail params={params} />
    </Suspense>
  );
}
