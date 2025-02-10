"use client"
import { BeatLoader } from "react-spinners"
import ReviewCard from "@/components/ReviewCard"
import LoadMore from "@/components/load-more"
import { BlurFade } from "@/components/ui/magicui/blur-fade"
import { useReviews } from "@/hooks/use-reviews"

const ReviewPage = () => {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useReviews()

  const reviews = data?.pages.flatMap((page) => page.reviews) ?? []

  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="text-3xl font-bold">Recent Reviews</h1>
      <div className="max-w-2xl mx-auto flex flex-col justify-center items-center">
        {isLoading && <BeatLoader color="#ffa600" size={20} />}
        <div className="grid grid-cols-1 gap-6 auto-rows-auto grid-auto-flow-dense">
          {reviews.map((review, index) => (
            <BlurFade
              key={`${review.user_id}-${review.game_name}-${index}`}
              delay={0.1 * index}
              className="break-inside-avoid"
            >
              <ReviewCard
                userName={review.user_name}
                gameName={review.game_name}
                rating={review.rating}
                reviewText={review.review}
              />
            </BlurFade>
          ))}
        </div>
        <LoadMore
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  )
}

export default ReviewPage
