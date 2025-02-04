"use client"
import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import { Marquee } from "@/components/ui/magicui/marquee"
import type { Game } from "@/gameTypes"
import { gameList } from "@/rawg"
import CarouselCard from "./CarouselCard"

//for getting upcoming games
const Upcoming = () => {
  const [games, setGames] = useState<Game[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true)
      const response = await gameList({
        pageSize: 8,
        pageIndex: 1,
        page: 1,
        ordering: "-released",
      })
      const { results } = response
      return results
    }
    //setting games to the results of loadGames
    ;(async () => {
      try {
        setGames(await loadGames())
        setLoading(false)
      } catch (error) {
        console.error("Error loading games:", error)
      }
    })()
  }, []) //fixed request loop due to games dependency

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold">New and Upcoming</h1>
      {games ? (
        games.length ? (
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
        )
      ) : (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
    </div>
  )
}

export default Upcoming
