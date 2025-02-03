"use client"
import React, { useEffect, useState } from "react"
import { database, databaseId, reviewCol } from "@/utils/appwrite"
import { Query } from "appwrite"
import ReviewCard from "@/components/ReviewCard"
import { BeatLoader } from "react-spinners"

interface Review {
  user_id: string
  user_name: string
  game_name: string
  rating: number
  review: string
}

const ReviewPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)

  const PAGE_SIZE = 20

  const loadReviews = async (page: number) => {
    setLoading(true)
    try {
      const response = await database.listDocuments(databaseId, reviewCol, [
        Query.orderDesc("$createdAt"),
        Query.limit(PAGE_SIZE),
        Query.offset((page - 1) * PAGE_SIZE),
      ])
      const newReviews = response.documents.map((doc: any) => ({
        user_id: doc.user_id,
        user_name: doc.user_name,
        game_name: doc.game_name,
        rating: doc.rating,
        review: doc.review,
      }))

      // Prevent duplicates by checking if the review already exists in the state
      setReviews((prevReviews) => {
        const existingReviewIds = new Set(
          prevReviews.map((review) => review.user_id + review.game_name),
        )
        const filteredNewReviews = newReviews.filter(
          (review) => !existingReviewIds.has(review.user_id + review.game_name),
        )
        return [...prevReviews, ...filteredNewReviews]
      })

      setHasMore(newReviews.length === PAGE_SIZE)
    } catch (error) {
      console.error("Error loading reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Reset reviews state when page changes
    setReviews([])
    loadReviews(page)
  }, [page])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-gray-300 text-3xl font-bold">Recent Reviews</h1>
      <div className="flex flex-col justify-center items-center">
        {loading && <BeatLoader color="#ffa600" size={20} loading={true} />}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto grid-auto-flow-dense">
          {reviews.map((review, index) => (
            <div key={index} className="break-inside-avoid">
              <ReviewCard
                userName={review.user_name}
                gameName={review.game_name}
                rating={review.rating}
                reviewText={review.review}
              />
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="flex flex-col my-4 justify-center items-center">
            <button
              className="bg-red-500 p-2 px-4 rounded hover:scale-105 transition-transform duration-300 ease-in-out font-semibold text-gray-100"
              onClick={handleLoadMore}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewPage
