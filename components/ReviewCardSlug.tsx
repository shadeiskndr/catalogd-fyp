import { useState } from "react"
import { FaStar } from "react-icons/fa"
import ReviewDetailDialog from "@/components/review-detail-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ReviewCardProps = {
  userName: string
  rating: number
  reviewText: string
  gameName?: string
}

const ReviewCardSlug = ({
  userName,
  rating,
  reviewText,
  gameName = "Game",
}: ReviewCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const maxLength = 200
  const getRatingColor = (rating: number) => {
    if (rating === 10) return "text-green-400"
    if (rating >= 7) return "text-green-600"
    if (rating >= 4) return "text-yellow-400"
    return "text-red-500"
  }

  const getReviewTitle = (rating: number) => {
    if (rating === 10) return "Recommended, amazing! 😍"
    if (rating >= 7) return "Satisfied, good game. 😊"
    if (rating >= 4) return "Fine, an okay game. 😐"
    return "Avoid, terrible game. 😞"
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
    >
      <div
        className={cn(
          "w-full p-5 rounded-xl relative z-20",
          "will-change-transform translate-z-0",
        )}
      >
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium">
            <h2 className="font-extrabold text-lg text-gray-100">{userName}</h2>
            <p className="text-xs text-gray-300">{getReviewTitle(rating)}</p>
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
              onClick={() => setIsDialogOpen(true)}
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

export default ReviewCardSlug
