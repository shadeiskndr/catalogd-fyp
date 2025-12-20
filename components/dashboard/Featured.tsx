"use client"
import { BeatLoader } from "react-spinners"
import { BentoGrid } from "@/components/ui/magicui/bento-grid"
import { useFeaturedGames } from "@/hooks/use-games"
import CarouselCard from "./CarouselCard"

const Featured = () => {
  const { data: games, isLoading, isError, error } = useFeaturedGames()

  if (isError) {
    return (
      <div>
        <h1 className="text-xl md:text-3xl font-bold">Featured</h1>
        <p className="text-red-500">Error loading games: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold">Featured</h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      ) : games && games.length > 0 ? (
        <BentoGrid className="py-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-center">
              <CarouselCard game={game} />
            </div>
          ))}
        </BentoGrid>
      ) : (
        <p>No games found</p>
      )}
    </div>
  )
}

export default Featured
