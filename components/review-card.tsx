"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ReviewDetailDialog } from "@/components/review-detail-dialog";
import { Button } from "@/components/ui/button";
import { catalogImage } from "@/lib/catalog-image";
import { formatTimestamp } from "@/lib/format";
import { ratingColor, ratingLabel } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

const EXCERPT_LENGTH = 200;

function ReviewBackdrop({ image, eager }: { image: string; eager: boolean }) {
  if (image.length === 0) {
    return (
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-card via-card to-secondary/70" />
    );
  }

  return (
    <>
      <Image
        src={catalogImage(image)}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        loading={eager ? "eager" : "lazy"}
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-black/90 via-black/80 to-black/60" />
    </>
  );
}

function ReviewScore({ rating, onImage }: { rating: number; onImage: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 ring-1",
        onImage ? "bg-black/40 ring-white/10" : "bg-secondary ring-border"
      )}
    >
      <span className={cn("font-semibold text-sm tabular-nums", ratingColor(rating))}>
        {rating}
      </span>
      <Star className={cn("size-3.5", ratingColor(rating))} fill="currentColor" />
      <span className="sr-only">out of 10</span>
    </div>
  );
}

function ReviewHeading({ label, href }: { label: string; href: string | null }) {
  if (href === null) {
    return <h3 className="truncate font-semibold text-base leading-snug">{label}</h3>;
  }

  return (
    <h3 className="truncate font-semibold text-base leading-snug">
      <Link
        href={href}
        prefetch
        className="rounded transition-opacity duration-150 ease-out hover:opacity-75 focus-visible:outline-none"
      >
        {label}
      </Link>
    </h3>
  );
}

type ReviewCardProps = {
  userName: string;
  gameName: string;
  gameSlug: string | null;
  gameImage: string;
  rating: number;
  reviewText: string;
  createdAt?: number;
  variant?: "feed" | "game";
  eager?: boolean;
};

export function ReviewCard({
  userName,
  gameName,
  gameSlug,
  gameImage,
  rating,
  reviewText,
  createdAt,
  variant = "feed",
  eager = false,
}: ReviewCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isFeed = variant === "feed";

  const image = isFeed ? gameImage : "";
  const heading = isFeed ? gameName : userName;
  const subheading = isFeed ? userName : ratingLabel(rating);
  const href = isFeed && gameSlug !== null ? `/game/${gameSlug}` : null;

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  return (
    <article
      className={cn(
        "relative isolate flex h-full flex-col overflow-hidden rounded-xl border bg-card",
        "ease transition-[border-color,box-shadow] duration-150",
        "hover-hover:hover:border-ring/60 hover-hover:hover:shadow-md"
      )}
    >
      <ReviewBackdrop image={image} eager={eager} />

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-5",
          image.length === 0 ? "text-card-foreground" : "text-white"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <ReviewHeading label={heading} href={href} />
            <p className="truncate text-xs opacity-70">
              {subheading}
              {createdAt === undefined ? null : (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{formatTimestamp(createdAt)}</span>
                </>
              )}
            </p>
          </div>
          <ReviewScore rating={rating} onImage={image.length > 0} />
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed opacity-90">{reviewText}</p>

        {reviewText.length > EXCERPT_LENGTH ? (
          <Button
            variant="link"
            onClick={openDialog}
            className="mt-auto h-auto justify-start self-start p-0 text-current text-sm opacity-80 transition-opacity duration-150 ease-out hover:opacity-100"
          >
            Read full review
          </Button>
        ) : null}
      </div>

      <ReviewDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        gameName={gameName}
        userName={userName}
        rating={rating}
        reviewText={reviewText}
      />
    </article>
  );
}
