"use client"

import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import { Loader2, Search } from "lucide-react"
import Image from "next/image"
import { type ChangeEvent, useState } from "react"
import { toast } from "react-hot-toast"
import { FaStar } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { api } from "@/convex/_generated/api"
import type { Game } from "@/gameTypes"
import { useDebounceCallback } from "@/hooks/use-debounce-callback"
import { useGameSearch } from "@/hooks/use-games-extended"
import placeholderImg from "@/public/imgs/imgPlaceholder.jpg"

const WriteReview = () => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [review, setReview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const createReview = useMutation(api.reviews.create)

  // Debounce search term updates
  const debouncedSetSearchTerm = useDebounceCallback(
    (value: string) => setDebouncedSearchTerm(value),
    300,
  )

  // Use React Query for game search
  const { data: searchResults, isLoading } = useGameSearch(debouncedSearchTerm)
  const searchedGames = searchResults?.results ?? []

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game)
    setSearchTerm("")
    setOpen(false)
  }

  const handleRatingChange = (value: number[]) => {
    setRating(value[0])
  }

  const handleReviewChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReview(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedGame || rating < 1 || rating > 10 || !review) {
      toast.error("Please fill in all fields correctly.")
      return
    }

    setIsSubmitting(true)

    try {
      await createReview({
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        rating,
        review,
      })

      toast.success("Review submitted successfully!")
      setSelectedGame(null)
      setRating(5)
      setReview("")
    } catch (error) {
      console.error("Error submitting review:", error)
      if (error instanceof ConvexError && typeof error.data === "string") {
        toast.error(error.data)
      } else {
        toast.error("Error submitting review.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating === 10) return "text-green-400"
    if (rating >= 7) return "text-green-600"
    if (rating >= 4) return "text-yellow-400"
    return "text-red-500"
  }

  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="text-3xl font-bold">Write Review</h1>
      <div className="w-full max-w-2xl  p-6 rounded-lg shadow-lg mx-auto mt-10 border">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Review and Rate a Game
        </h1>
        <div className="mb-4">
          <InputGroup onClick={() => setOpen(true)} className="cursor-pointer">
            <InputGroupAddon align="inline-start">
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search for a game..."
              value={selectedGame ? selectedGame.name : ""}
              readOnly
              className="cursor-pointer"
            />
          </InputGroup>
        </div>

        <CommandDialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) setSearchTerm("")
          }}
        >
          <CommandInput
            placeholder="Search games..."
            value={searchTerm}
            onInput={(e) => {
              const value = e.currentTarget.value
              setSearchTerm(value)
              debouncedSetSearchTerm(value)
            }}
          />
          <CommandList>
            {debouncedSearchTerm.length > 2 && isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mb-2 size-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : debouncedSearchTerm.length <= 2 ? (
              <CommandEmpty>Type at least 3 characters to search.</CommandEmpty>
            ) : (
              <CommandEmpty>No games found.</CommandEmpty>
            )}

            {debouncedSearchTerm.length > 2 && (
              <CommandGroup heading="Games">
                {searchedGames && searchedGames.length > 0 ? (
                  searchedGames.map((game) => (
                    <CommandItem
                      className="py-2"
                      key={game.id}
                      value={game.slug}
                      onSelect={() => handleGameSelect(game)}
                    >
                      {game.background_image && (
                        <Image
                          src={game.background_image || placeholderImg}
                          alt={game.name}
                          width={32}
                          height={32}
                          className="mr-2 size-8 rounded"
                        />
                      )}
                      <div className="flex flex-col">
                        <span>{game.name}</span>
                        {game.released && (
                          <span className="text-xs opacity-50">
                            {game.released}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No games found
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
        {selectedGame && (
          <form onSubmit={handleSubmit}>
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-center">
                  <Image
                    src={selectedGame.background_image || placeholderImg}
                    alt={selectedGame.name}
                    width={200}
                    height={100}
                    className="rounded"
                  />
                </div>
                <CardTitle className="text-center text-2xl mt-4">
                  {selectedGame.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Rating</Label>
                  <div className="space-y-3">
                    <Slider
                      value={[rating]}
                      onValueChange={handleRatingChange}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-center items-center text-2xl gap-2">
                      <span className={getRatingColor(rating)}>{rating}</span>
                      <FaStar className={getRatingColor(rating)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Review</Label>
                  <InputGroup>
                    <InputGroupTextarea
                      placeholder="Share your thoughts about this game..."
                      value={review}
                      onChange={handleReviewChange}
                      required
                    />
                  </InputGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}

export default WriteReview
