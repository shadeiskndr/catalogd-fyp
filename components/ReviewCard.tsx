import Link from "next/link"
import { useState } from "react"
import { FaStar } from "react-icons/fa"
import { useGameByName, useGameDetails } from "@/hooks/use-games-extended"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import ReviewDetailDialog from "@/components/review-detail-dialog"

type ReviewCardProps = {
  userName: string
  gameName: string
  rating: number
  reviewText: string
  gameSlug?: string
}

const ReviewCard = ({
  userName,
  gameName,
  rating,
  reviewText,
  gameSlug,
}: ReviewCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const maxLength = 200

  // Fetch slug from game name if not provided
  const { data: fetchedSlug } = useGameByName(gameName)
  const slug = gameSlug || fetchedSlug

  // Fetch game details to get background image
  const { data: gameDetails } = useGameDetails(slug || "")

  const getRatingColor = (rating: number) => {
    if (rating === 10) return "text-green-400"
    if (rating >= 7) return "text-green-600"
    if (rating >= 4) return "text-yellow-400"
    return "text-red-500"
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open dialog if clicking the game name link
    if ((e.target as HTMLElement).closest("a")) {
      return
    }
    setIsDialogOpen(true)
  }

  return (
    <div
      className={cn(
        "w-full h-max rounded-xl p-1.5 relative isolate overflow-hidden",
        "before:absolute before:inset-0 before:rounded-xl before:bg-black/60 before:dark:bg-black/60 before:z-10",
        "border border-black/10 dark:border-white/10",
        "shadow-[0_8px_16px_rgb(0_0_0_/_0.15)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
        "will-change-transform translate-z-0",
        "hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.2)] dark:hover:shadow-[0_12px_24px_rgb(0_0_0_/_0.35)]",
        "transition-shadow duration-300",
      )}
      style={{
        backgroundImage: gameDetails?.background_image
          ? `url('${gameDetails.background_image}')`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={cn(
          "w-full p-5 rounded-xl relative z-20",
          "will-change-transform translate-z-0",
        )}
      >
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium">
            <Link href={`/game/${slug}`}>
              <h3 className="font-extrabold text-lg text-gray-100 hover:underline transition-colors cursor-pointer">
                {gameName}
              </h3>
            </Link>
            <p className="text-xs text-gray-300">{userName}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-lg font-semibold ${getRatingColor(rating)}`}>
              {rating}
            </span>
            <FaStar className={`${getRatingColor(rating)} h-4 w-4`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
            {reviewText}
          </p>
          {reviewText.length > maxLength && (
            <Button
              variant="ghost"
              className="mt-2 p-0 h-auto underline text-sm text-gray-300"
              onClick={handleCardClick}
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
  )
}

export default ReviewCard
