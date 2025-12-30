"use client";

import { BookOpenText, Pencil } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
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
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/use-reviews";

const GRID_CLASSES = "grid auto-rows-fr grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3";
const STAGGER_STEP = 0.04;
const STAGGER_CAP = 7;
const SKELETON_COUNT = 6;

function ReviewsSkeleton() {
  const placeholders = Array.from({ length: SKELETON_COUNT }, (_, index) => `review-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-11/12 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { reviews, isLoading, isLoadingMore, hasMore, loadMore } = useReviews();

  return (
    <>
      <PageHeader
        title="Recent Reviews"
        description="What the community is playing and how they rated it."
        actions={
          <Button asChild className="active:scale-[0.98]">
            <Link href="/write-review" prefetch>
              <Pencil className="size-4" />
              <span>Write a review</span>
            </Link>
          </Button>
        }
      />

      {isLoading ? <ReviewsSkeleton /> : null}

      {!isLoading && reviews.length === 0 ? (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenText />
            </EmptyMedia>
            <EmptyTitle>No reviews yet</EmptyTitle>
            <EmptyDescription>
              Be the first to rate a game and tell everyone what you thought.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild className="active:scale-[0.98]">
              <Link href="/write-review" prefetch>
                <Pencil className="size-4" />
                <span>Write the first review</span>
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <div className={GRID_CLASSES}>
            {reviews.map((review, index) => (
              <BlurFade
                key={`${review.userId}-${review.gameId}`}
                delay={Math.min(index, STAGGER_CAP) * STAGGER_STEP}
                inView
                className="h-full"
              >
                <ReviewCard
                  userName={review.userName}
                  gameName={review.gameName}
                  gameSlug={review.gameSlug}
                  gameImage={review.gameImage}
                  rating={review.rating}
                  reviewText={review.review}
                  createdAt={review.createdAt}
                  eager={index < 3}
                />
              </BlurFade>
            ))}
          </div>
          <LoadMore hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={loadMore} />
        </>
      ) : null}
    </>
  );
}
