import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadMoreProps {
  page?: number
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  onLoadPrevious?: () => void
}

export default function LoadMore({
  page = 0,
  hasMore,
  isLoading,
  onLoadMore,
  onLoadPrevious,
}: LoadMoreProps) {
  if (isLoading) return null

  const hasPrevious = page > 1 && onLoadPrevious

  return (
    <div className="flex flex-col gap-4 items-center pt-4">
      <div className="flex gap-3 items-center">
        {hasPrevious && (
          <Button
            onClick={onLoadPrevious}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>
        )}

        {hasMore && (
          <Button onClick={onLoadMore} size="lg" className="gap-2">
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
