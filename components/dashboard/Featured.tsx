"use client"
import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import type { Game } from "@/gameTypes"
import { gameList } from "@/rawg"
import CarouselCard from "./CarouselCard"
import { BentoGrid } from "@/components/ui/magicui/bento-grid"

const getSpotlightItems = (items: unknown[], length: number) => {
  const randomItems: unknown[] = []
  while (randomItems.length < length) {
    const index = Math.floor(Math.random() * items.length)
    if (!randomItems.includes(items[index])) {
      randomItems.push(items[index])
    }
  }
  return randomItems
}

const Featured = () => {
  const [games, setGames] = useState<Game[] | null>(null)

  useEffect(() => {
    const loadGames = async () => {
      const pageNo = Math.floor(Math.random() * 3) + 1
      const response = await gameList({
        pageIndex: 0,
        page: pageNo,
        pageSize: 30,
      })
      let { results } = response
      results = results.filter((game) => game.metacritic > 40)
      return results
    }
    //setting games to the results of loadGames
    ;(async () => {
      const loadedGames = await loadGames()
      const games = getSpotlightItems(loadedGames, 3) as Game[]
      setGames(games)
    })()
  }, [])

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold">Featured</h1>
      {games ? (
        games.length ? (
          <BentoGrid className="py-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {games.map((game) => (
              <div key={game.id} className="flex items-center justify-center">
                <CarouselCard game={game} />
              </div>
            ))}
          </BentoGrid>
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

export default Featured
