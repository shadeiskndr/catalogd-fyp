"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ReviewDetailDialog } from "@/components/review-detail-dialog";
import { Button } from "@/components/ui/button";
import { useGameDetails, useGameSlugByName } from "@/hooks/use-games";
import { rawgImage } from "@/lib/rawg-image";
import { ratingColor, ratingTitle } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

const EXCERPT_LENGTH = 200;

type ReviewCardProps = {
  userName: string;
  gameName: string;
  rating: number;
  reviewText: string;
  variant?: "feed" | "game";
  eager?: boolean;
};

export function ReviewCard({
  userName,
  gameName,
  rating,
  reviewText,
  variant = "feed",
  eager = false,
}: ReviewCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isFeed = variant === "feed";

  const { data: slug } = useGameSlugByName(isFeed ? gameName : "");
  const { data: gameDetails } = useGameDetails(slug ?? "");

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  return (
    <div
      className={cn(
        "relative isolate h-max w-full overflow-hidden rounded-xl p-1.5",
        "before:absolute before:inset-0 before:z-10 before:rounded-xl before:bg-black/60",
        "border border-black/10 dark:border-white/10",
        "shadow-[0_8px_16px_rgb(0_0_0_/_0.15)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
        "hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.2)] dark:hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.35)]",
        "transition-shadow duration-300"
      )}
    >
      {gameDetails?.background_image ? (
        <Image
          src={rawgImage(gameDetails.background_image, 640)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover"
        />
      ) : null}
      <div className="relative z-20 w-full rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="font-medium text-sm">
            {isFeed ? (
              <>
                <h3 className="font-extrabold text-gray-100 text-lg transition-colors hover:underline">
                  <Link href={slug === null || slug === undefined ? "#" : `/game/${slug}`}>
                    {gameName}
                  </Link>
                </h3>
                <p className="text-gray-300 text-xs">{userName}</p>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-gray-100 text-lg">{userName}</h3>
                <p className="text-gray-300 text-xs">{ratingTitle(rating)}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className={`font-semibold text-lg ${ratingColor(rating)}`}>{rating}</span>
            <Star className={`size-4 ${ratingColor(rating)}`} fill="currentColor" />
          </div>
        </div>
        <div className="mt-4">
          <p className="line-clamp-3 text-gray-300 text-sm leading-relaxed">{reviewText}</p>
          {reviewText.length > EXCERPT_LENGTH && (
            <Button
              variant="ghost"
              className="mt-2 h-auto p-0 text-gray-300 text-sm underline"
              onClick={openDialog}
            >
              Read Full Review
            </Button>
          )}
        </div>
      </div>

      <ReviewDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        gameName={gameName}
        userName={userName}
        rating={rating}
        reviewText={reviewText}
      />
    </div>
  );
}
