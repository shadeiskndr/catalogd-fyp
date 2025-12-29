"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Search, Star, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type FormEvent, useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { GameSearchDialog } from "@/components/game-search-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { MetacriticBadge } from "@/components/metacritic-badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { formatReleaseDate } from "@/lib/format";
import type { Game } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";
import { ratingColor, ratingTitle } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";
const DEFAULT_RATING = 5;
const MAX_REVIEW_LENGTH = 2000;

export default function WriteReviewPage() {
  const reviewId = useId();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [rating, setRating] = useState(DEFAULT_RATING);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReview = useMutation(api.reviews.create);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const clearGame = useCallback(() => {
    setSelectedGame(null);
  }, []);

  const handleRatingChange = useCallback((value: number[]) => {
    setRating(value[0] ?? DEFAULT_RATING);
  }, []);

  const handleReviewChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setReview(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (selectedGame === null || review.trim().length === 0) {
        toast.error("Please pick a game and write a review.");
        return;
      }

      setIsSubmitting(true);
      try {
        await createReview({
          gameId: selectedGame.id,
          gameName: selectedGame.name,
          rating,
          review,
        });
        toast.success("Review submitted successfully!");
        setSelectedGame(null);
        setRating(DEFAULT_RATING);
        setReview("");
      } catch (error) {
        console.error("Error submitting review:", error);
        toast.error(
          error instanceof ConvexError && typeof error.data === "string"
            ? error.data
            : "Error submitting review."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createReview, rating, review, selectedGame]
  );

  return (
    <>
      <PageHeader
        title="Write a Review"
        description="Pick a game, set a score out of ten, and say what you actually thought."
      />

      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`${reviewId}-search`}>Game</Label>
          {selectedGame === null ? (
            <InputGroup onClick={openSearch} className="cursor-pointer">
              <InputGroupAddon align="inline-start">
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                id={`${reviewId}-search`}
                name="game"
                placeholder="Search for a game..."
                value=""
                readOnly
                className="cursor-pointer"
              />
            </InputGroup>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={rawgImage(selectedGame.background_image || PLACEHOLDER_IMAGE, 420)}
                  alt={selectedGame.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-semibold text-sm">{selectedGame.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatReleaseDate(selectedGame.released)}
                  </span>
                  {selectedGame.metacritic > 0 ? (
                    <MetacriticBadge score={selectedGame.metacritic} />
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={openSearch}>
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearGame}
                  aria-label="Clear selected game"
                  className="text-muted-foreground transition-transform duration-150 ease-out hover:text-foreground active:scale-90"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <GameSearchDialog
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onSelectGame={setSelectedGame}
        />

        {selectedGame === null ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            Choose a game above to score it and write your review.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-sm">Rating</span>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("font-bold text-2xl tabular-nums", ratingColor(rating))}>
                    {rating}
                  </span>
                  <span className="text-muted-foreground text-sm">/ 10</span>
                  <Star
                    className={cn("size-4 self-center", ratingColor(rating))}
                    fill="currentColor"
                  />
                </div>
              </div>
              <Slider
                value={[rating]}
                onValueChange={handleRatingChange}
                min={1}
                max={10}
                step={1}
                aria-label="Rating out of 10"
              />
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>1</span>
                <span className="font-medium text-foreground">{ratingTitle(rating)}</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={reviewId}>Review</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {review.length} / {MAX_REVIEW_LENGTH}
                </span>
              </div>
              <Textarea
                id={reviewId}
                name="review"
                placeholder="Share your thoughts about this game..."
                value={review}
                onChange={handleReviewChange}
                maxLength={MAX_REVIEW_LENGTH}
                required
                className="min-h-40 resize-y"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || review.trim().length === 0}
              className="w-full active:scale-[0.99]"
            >
              {isSubmitting ? <Spinner className="size-4" /> : null}
              <span>{isSubmitting ? "Submitting" : "Submit review"}</span>
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
