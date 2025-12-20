"use client"
import { BeatLoader } from "react-spinners"
import LoadMore from "@/components/load-more"
import ReviewCard from "@/components/ReviewCard"
import { BlurFade } from "@/components/ui/magicui/blur-fade"
import { useReviews } from "@/hooks/use-reviews"

const ReviewPage = () => {
  const { reviews, isLoading, isLoadingMore, hasMore, loadMore } = useReviews()

  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="text-3xl font-bold">Recent Reviews</h1>
      <div className="max-w-2xl mx-auto flex flex-col justify-center items-center">
        {isLoading && <BeatLoader color="#ffa600" size={20} />}
        <div className="grid grid-cols-1 gap-6 auto-rows-auto grid-auto-flow-dense">
          {reviews.map((review, index) => (
            <BlurFade
              key={`${review.userId}-${review.gameName}-${index}`}
              delay={0.1 * index}
              className="break-inside-avoid"
            >
              <ReviewCard
                userName={review.userName}
                gameName={review.gameName}
                rating={review.rating}
                reviewText={review.review}
              />
            </BlurFade>
          ))}
        </div>
        <LoadMore
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  )
}

export default ReviewPage
