"use client"
import { useParams } from "next/navigation"
import { useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import { useGenreGames, useGenreList } from "@/hooks/use-games-extended"

const GenrePage = () => {
  const params = useParams()
  const slug = params.slug as string
  const [pageNo, setPageNo] = useState<number>(1)

  // Fetch genre list and find the matching genre
  const { data: genreListData } = useGenreList()
  const genre = genreListData?.results.find((g) => g.slug === slug)

  // Fetch games for this genre with pagination
  const {
    data,
    isLoading: loading,
    isFetching,
  } = useGenreGames(slug, pageNo, 20, "popularity")

  const games = data?.results || []
  const hasNextPage = games.length >= 20

  //setting the page number to the next page
  const handleFetchNextPage = async () => {
    setPageNo(pageNo + 1)
  }

  return (
    <div className="space-y-4">
      {genre ? (
        <h1 className="text-3xl font-bold">{genre.name}</h1>
      ) : (
        <div>
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
      <div className="flex flex-col justify-center items-center">
        {loading && pageNo === 1 ? (
          <div>
            <BeatLoader color="#ffa600" size={20} loading={true} />
          </div>
        ) : games.length > 0 ? (
          <div className="pb-4">
            <Grid games={games} />
            {hasNextPage && (
              <div className="flex flex-col my-4 justify-center items-center">
                <button
                  type="button"
                  className="bg-red-600 p-2 px-4 rounded hover:scale-105 transition-transform
                  duration-300 ease-in-out font-semibold text-gray-100"
                  onClick={handleFetchNextPage}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <span>Loading...</span>
                  ) : (
                    <span>Load More</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="font-semibold">No games found.</span>
        )}
      </div>
    </div>
  )
}

export default GenrePage
