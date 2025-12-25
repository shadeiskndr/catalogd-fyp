"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Search, Star } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type FormEvent, useCallback, useId, useState } from "react";
import { toast } from "sonner";
import { GameSearchDialog } from "@/components/game-search-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { api } from "@/convex/_generated/api";
import type { Game } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";
import { ratingColor } from "@/lib/review-rating";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";
const DEFAULT_RATING = 5;

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
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">Write Review</h1>
      <div className="mx-auto mt-10 w-full max-w-2xl rounded-lg border p-6 shadow-lg">
        <h2 className="mb-4 text-center font-bold text-2xl">Review and Rate a Game</h2>
        <div className="mb-4">
          <InputGroup onClick={openSearch} className="cursor-pointer">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search for a game..."
              value={selectedGame?.name ?? ""}
              readOnly
              className="cursor-pointer"
            />
          </InputGroup>
        </div>

        <GameSearchDialog
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onSelectGame={setSelectedGame}
        />

        {selectedGame !== null && (
          <form onSubmit={handleSubmit}>
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-center">
                  <Image
                    src={rawgImage(selectedGame.background_image || PLACEHOLDER_IMAGE, 420)}
                    alt={selectedGame.name}
                    width={200}
                    height={100}
                    className="rounded"
                  />
                </div>
                <CardTitle className="mt-4 text-center text-2xl">{selectedGame.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Rating</Label>
                  <Slider
                    value={[rating]}
                    onValueChange={handleRatingChange}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-2xl">
                    <span className={ratingColor(rating)}>{rating}</span>
                    <Star className={ratingColor(rating)} fill="currentColor" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={reviewId}>Review</Label>
                  <InputGroup>
                    <InputGroupTextarea
                      id={reviewId}
                      placeholder="Share your thoughts about this game..."
                      value={review}
                      onChange={handleReviewChange}
                      required
                    />
                  </InputGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}
