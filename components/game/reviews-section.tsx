"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { ReviewCard } from "@/components/review-card";
import { Spinner } from "@/components/ui/spinner";
import { useGameReviews } from "@/hooks/use-reviews";

export function ReviewsSection({ gameName }: { gameName: string }) {
  const { reviews, isLoading } = useGameReviews(gameName);

  return (
    <section className="my-6 bg-indigo-100/10 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg md:text-xl lg:text-2xl">Reviews</h2>
        <Link href="/write-review" className="flex items-center text-sm hover:underline">
          <Pencil className="mr-1 size-5" />
          Add a Review
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
      {!isLoading && reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews available for this game.</p>
      ) : null}
      {reviews.length > 0 ? (
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
      ) : null}
    </section>
  );
}
