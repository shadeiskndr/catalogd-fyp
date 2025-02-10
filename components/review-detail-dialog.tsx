import { FaStar } from "react-icons/fa"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReviewDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameName: string
  userName: string
  rating: number
  reviewText: string
}

const ReviewDetailDialog = ({
  open,
  onOpenChange,
  gameName,
  userName,
  rating,
  reviewText,
}: ReviewDetailDialogProps) => {
  const getRatingColor = (rating: number) => {
    if (rating === 10) return "text-green-400"
    if (rating >= 7) return "text-green-600"
    if (rating >= 4) return "text-yellow-400"
    return "text-red-500"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-xl">{gameName}</DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-md font-semibold ${getRatingColor(rating)}`}>
                  {rating}
                </span>
                <FaStar className={`${getRatingColor(rating)} size-3`} />
                <span className="text-sm text-gray-500">by {userName}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed break-words">
                {reviewText}
              </p>
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewDetailDialog
