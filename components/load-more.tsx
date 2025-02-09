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

  return (
    <div className="flex justify-center mt-4 space-x-4">
      {page > 1 && onLoadPrevious && (
        <Button onClick={onLoadPrevious}>Previous Page</Button>
      )}
      {hasMore && <Button onClick={onLoadMore}>Load More</Button>}
    </div>
  )
}
