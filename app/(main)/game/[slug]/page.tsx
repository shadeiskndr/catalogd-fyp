"use client"
import { PencilIcon } from "@heroicons/react/24/solid"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BeatLoader } from "react-spinners"
import Banner from "@/components/game/Banner"
import Info from "@/components/game/Info"
import ReviewCardSlug from "@/components/ReviewCardSlug"
import { useGameDetails, useGameScreenshots } from "@/hooks/use-games-extended"
import { useReviews } from "@/hooks/use-reviews"

const GamePage = () => {
  const params = useParams()
  const slug = params.slug as string
  const { data: game, isLoading: loading } = useGameDetails(slug)
  const { data: screenshots } = useGameScreenshots(slug)
  const { data: reviewData, isLoading: loadingReviews } = useReviews(game?.name)

  const reviews = reviewData?.pages.flatMap((page) => page.reviews) || []

  return (
    <div>
      {game?.background_image && (
        <div className="fixed inset-0 opacity-20 blur-sm pointer-events-none z-0">
          <Image
            src={game.background_image}
            alt="bg"
            fill
            className="object-cover"
          />
        </div>
      )}
      {game ? (
        <div>
          <Banner
            bannerImg={game.background_image}
            gameName={game.name}
            gameRating={game.metacritic}
            gameReleaseDate={game.released}
            gameGenres={game.genres}
            gameId={game.id}
          />
          {screenshots?.results ? (
            <Info game={game} screenshots={screenshots.results} />
          ) : (
            <BeatLoader
              className="flex mx-auto my-2"
              color="#ffa600"
              size={20}
              loading={loading}
            />
          )}
          {/* Reviews Section */}
          <div className="p-6 bg-indigo-100/10 my-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
                Reviews
              </h1>
              <Link
                href="/Write"
                className="flex items-center text-sm hover:underline"
              >
                <PencilIcon className="h-5 w-5 mr-1" />
                Add a Review
              </Link>
            </div>
            {loadingReviews ? (
              <BeatLoader
                className="flex mx-auto my-2"
                color="#ffa600"
                size={20}
                loading={loadingReviews}
              />
            ) : reviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review, index) => (
                  <ReviewCardSlug
                    key={index}
                    userName={review.user_name}
                    gameName={review.game_name}
                    rating={review.rating}
                    reviewText={review.review}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">
                No reviews available for this game.
              </p>
            )}
          </div>
        </div>
      ) : (
        <BeatLoader
          className="flex mx-auto my-2"
          color="#ffa600"
          size={20}
          loading={loading}
        />
      )}
    </div>
  )
}

export default GamePage
