"use client";

import { Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Banner } from "@/components/game/banner";
import { Info } from "@/components/game/info";
import { ReviewCard } from "@/components/review-card";
import { Spinner } from "@/components/ui/spinner";
import { useGameDetails, useGameScreenshots } from "@/hooks/use-games";
import { useGameReviews } from "@/hooks/use-reviews";

export default function GamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: game, isLoading } = useGameDetails(slug);
  const { data: screenshots } = useGameScreenshots(slug);
  const { reviews, isLoading: isLoadingReviews } = useGameReviews(game?.name);

  if (game === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-8 text-primary" />
        <span className="sr-only">{isLoading ? "Loading game" : "Game not found"}</span>
      </div>
    );
  }

  return (
    <div>
      {game.background_image.length > 0 ? (
        <div className="pointer-events-none fixed inset-0 z-0 opacity-20 blur-sm">
          <Image src={game.background_image} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      ) : null}
      <Banner game={game} />
      {screenshots === undefined ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <Info game={game} screenshots={screenshots.results} />
      )}

      <section className="my-6 bg-indigo-100/10 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg md:text-xl lg:text-2xl">Reviews</h2>
          <Link href="/write-review" className="flex items-center text-sm hover:underline">
            <Pencil className="mr-1 size-5" />
            Add a Review
          </Link>
        </div>
        {isLoadingReviews ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : null}
        {!isLoadingReviews && reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews available for this game.</p>
        ) : null}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard
                key={`${review.userId}-${review.gameId}`}
                variant="game"
                userName={review.userName}
                gameName={review.gameName}
                rating={review.rating}
                reviewText={review.review}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
