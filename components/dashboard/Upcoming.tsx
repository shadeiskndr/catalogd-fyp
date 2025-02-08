"use client"
import { BeatLoader } from "react-spinners"
import { Marquee } from "@/components/ui/magicui/marquee"
import { useUpcomingGames } from "@/hooks/use-games"
import CarouselCard from "./CarouselCard"

//for getting upcoming games
const Upcoming = () => {
  const { data: games, isLoading, isError, error } = useUpcomingGames()

  if (isError) {
    return (
      <div>
        <h1 className="text-xl md:text-3xl font-bold">New and Upcoming</h1>
        <p className="text-red-500">Error loading games: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold">New and Upcoming</h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      ) : games && games.length > 0 ? (
        <div className="w-screen -mx-[calc((100vw-100%)/2)] overflow-hidden">
          <Marquee className="py-8" pauseOnHover repeat={2}>
            {games.map((game) => (
              <div key={game.id}>
                <CarouselCard game={game} />
              </div>
            ))}
          </Marquee>
        </div>
      ) : (
        <p>No games found</p>
      )}
    </div>
  )
}

export default Upcoming
