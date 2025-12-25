"use client";

import { LoadMore } from "@/components/load-more";
import { ReviewCard } from "@/components/review-card";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import { Spinner } from "@/components/ui/spinner";
import { useReviews } from "@/hooks/use-reviews";

export default function ReviewsPage() {
  const { reviews, isLoading, isLoadingMore, hasMore, loadMore } = useReviews();

  return (
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">Recent Reviews</h1>
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center">
        {isLoading ? <Spinner className="size-8 text-primary" /> : null}
        <div className="grid auto-rows-auto grid-cols-1 gap-6">
          {reviews.map((review, index) => (
            <BlurFade
              key={`${review.userId}-${review.gameId}`}
              delay={0.1 * index}
              className="break-inside-avoid"
            >
              <ReviewCard
                userName={review.userName}
                gameName={review.gameName}
                rating={review.rating}
                reviewText={review.review}
                eager={index < 2}
              />
            </BlurFade>
          ))}
        </div>
        <LoadMore hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={loadMore} />
      </div>
    </div>
  );
}
