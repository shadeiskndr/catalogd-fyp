"use client";

import { MessageSquareQuote, Pencil } from "lucide-react";
import Link from "next/link";
import { LoadMore } from "@/components/load-more";
import { ReviewCard } from "@/components/review-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useGameReviews } from "@/hooks/use-reviews";

const GRID_CLASSES = "grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";

function ReviewsSkeleton() {
  const placeholders = Array.from({ length: 3 }, (_, index) => `game-review-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="space-y-3 rounded-xl border bg-card p-5">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ReviewsSection({ gameName }: { gameName: string }) {
  const { reviews, isLoading, isLoadingMore, hasMore, loadMore } = useGameReviews(gameName);

  return (
    <section className="space-y-4 pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-2 font-semibold text-lg">
          <span>Reviews</span>
          {reviews.length > 0 ? (
            <span className="text-muted-foreground text-sm tabular-nums">{reviews.length}</span>
          ) : null}
        </h2>
        <Button asChild variant="outline" size="sm" className="gap-1.5 active:scale-[0.98]">
          <Link href="/write-review" prefetch>
            <Pencil className="size-4" />
            <span>Add a review</span>
          </Link>
        </Button>
      </div>

      {isLoading ? <ReviewsSkeleton /> : null}

      {!isLoading && reviews.length === 0 ? (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareQuote />
            </EmptyMedia>
            <EmptyTitle>No reviews for this game yet</EmptyTitle>
            <EmptyDescription>Be the first to score it and share your take.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild className="active:scale-[0.98]">
              <Link href="/write-review" prefetch>
                <Pencil className="size-4" />
                <span>Write a review</span>
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <div className={GRID_CLASSES}>
            {reviews.map((review) => (
              <ReviewCard
                key={`${review.userId}-${review.gameId}`}
                variant="game"
                userName={review.userName}
                gameName={review.gameName}
                rating={review.rating}
                reviewText={review.review}
                createdAt={review.createdAt}
              />
            ))}
          </div>
          <LoadMore hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={loadMore} />
        </>
      ) : null}
    </section>
  );
}
