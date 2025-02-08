"use client"

import { ID, Query } from "appwrite"
import Image from "next/image"
import { type ChangeEvent, useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { FaStar } from "react-icons/fa"
import type { Game } from "@/gameTypes"
import { useGameSearch } from "@/hooks/use-games-extended"
import placeholderImg from "@/public/imgs/imgPlaceholder.jpg"
import {
  database,
  databaseId,
  getSessionData,
  reviewCol,
  userID,
} from "@/utils/appwrite"

type ReviewFormProps = {
  collection: string
  gameId: number
  gameName: string
  gameReview: string
  gameRating: number
  userName: string
}

const WriteReview = () => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [review, setReview] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fetch user name on mount
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const sessionData = await getSessionData()
        if (sessionData && sessionData.name) {
          setUserName(sessionData.name)
        }
      } catch (error) {
        console.error("Error fetching user name:", error)
      }
    }

    fetchUserName()
  }, [])

  // Use React Query for game search
  const { data: searchResults } = useGameSearch(searchTerm)
  const searchedGames = searchResults?.results ?? []

  // Clear old timeout and set new one
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (searchTerm.trim() !== "" && searchTerm.length > 2) {
      searchTimeout.current = setTimeout(() => {
        // React Query handles the search via useGameSearch hook
      }, 300)
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
  }, [searchTerm])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game)
    setSearchTerm("")
  }

  const handleRatingChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRating(Number(e.target.value))
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
      // Check if the user has already written a review for the selected game
      const existingReviews = await database.listDocuments(
        databaseId,
        reviewCol,
        [
          Query.equal("user_id", userID),
          Query.equal("game_id", selectedGame.id),
        ],
      )

      if (existingReviews.total > 0) {
        toast.error("You have already written a review for this game.")
        setIsSubmitting(false)
        return
      }

      const reviewData: ReviewFormProps = {
        collection: reviewCol,
        gameId: selectedGame.id,
        gameName: selectedGame.name,
        gameReview: review,
        gameRating: rating,
        userName: userName,
      }

      await database.createDocument(
        `${databaseId}`,
        `${reviewData.collection}`,
        ID.unique(),
        {
          user_id: userID,
          game_id: reviewData.gameId,
          game_name: reviewData.gameName,
          review: reviewData.gameReview,
          rating: reviewData.gameRating,
          user_name: reviewData.userName,
        },
      )

      toast.success("Review submitted successfully!")
      setSelectedGame(null)
      setRating(5)
      setReview("")
      setIsSubmitting(false)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Error submitting review.")
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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Write Review</h1>
      <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">
          Review and Rate a Game
        </h1>
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search for a game..."
            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          {searchedGames.length > 0 && (
            <ul className="bg-gray-700 mt-2 rounded-md max-h-60 overflow-y-auto text-white">
              {searchedGames.map((game) => (
                <li
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="p-2 cursor-pointer hover:bg-gray-600 flex items-center space-x-4"
                >
                  <Image
                    src={game.background_image || placeholderImg}
                    alt="game cover"
                    width={50}
                    height={50}
                    className="rounded"
                  />
                  <span>{game.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedGame && (
          <form onSubmit={handleSubmit} className="bg-gray-700 p-4 rounded-md">
            <div className="flex justify-center mb-4">
              <Image
                src={selectedGame.background_image || placeholderImg}
                alt={selectedGame.name}
                width={200}
                height={100}
                className="rounded"
              />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center text-white">
              {selectedGame.name}
            </h2>
            <div className="mb-4">
              <label className="block mb-1 text-white">Rating:</label>
              <input
                type="range"
                value={rating}
                onChange={handleRatingChange}
                min="1"
                max="10"
                step="1"
                required
                className="w-full"
              />
              <div className="flex justify-center items-center mt-2 text-2xl">
                <span className={`mr-2 ${getRatingColor(rating)}`}>
                  {rating}
                </span>
                <FaStar className={`ml-1 ${getRatingColor(rating)}`} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-white">Review:</label>
              <textarea
                value={review}
                onChange={handleReviewChange}
                required
                className="w-full p-2 bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 ease-in-out disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default WriteReview
