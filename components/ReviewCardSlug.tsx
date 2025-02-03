import React from "react"
import { FaStar } from "react-icons/fa"

type ReviewCardProps = {
  userName: string
  rating: number
  reviewText: string
}

const ReviewCardSlug = ({ userName, rating, reviewText }: ReviewCardProps) => {
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
    <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center hover:scale-105 transition-all duration-300 ease-in-out">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white">{userName}</h2>
        <p className="text-gray-400">{getReviewTitle(rating)}</p>
        <p className="text-gray-300 mt-2">{reviewText}</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center text-xl font-bold">
        <span className={`mr-1 ${getRatingColor(rating)}`}>{rating}</span>
        <FaStar className={getRatingColor(rating)} />
      </div>
    </div>
  )
}

export default ReviewCardSlug
