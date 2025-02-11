"use client"
import { useParams } from "next/navigation"
import { useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import LoadMore from "@/components/load-more"
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
    isLoading,
    isFetching,
    error,
  } = useGenreGames(slug, pageNo, 20, "popularity")

  const loading = isLoading || isFetching
  const games = data?.games ?? []
  const hasMore = data?.hasMore ?? false

  const handleFetchNextPage = () => {
    setPageNo(pageNo + 1)
  }

  const handleFetchPreviousPage = () => {
    setPageNo((prevPage) => Math.max(prevPage - 1, 1))
  }

  return (
    <div className="space-y-4 py-4 px-2">
      {genre ? (
        <h1 className="text-3xl font-bold">{genre.name}</h1>
      ) : (
        <div>
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
      {games && games.length > 0 ? (
        <>
          <Grid games={games} />
          <LoadMore
            page={pageNo}
            hasMore={hasMore}
            isLoading={loading}
            onLoadMore={handleFetchNextPage}
            onLoadPrevious={handleFetchPreviousPage}
          />
        </>
      ) : !loading ? (
        <div className="mt-10">No games found.</div>
      ) : null}
      {loading && (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
      {error && (
        <div className="mt-10 text-red-500">
          Error loading games. Please try again.
        </div>
      )}
    </div>
  )
}

export default GenrePage
