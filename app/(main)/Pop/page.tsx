"use client"
import { useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import LoadMore from "@/components/load-more"
import { usePopularGames } from "@/hooks/use-games"

const Mpop = () => {
  const [page, setPage] = useState<number>(1)
  const { data, isLoading, isFetching, error } = usePopularGames(page, 10)

  const loading = isLoading || isFetching

  const games = data?.games ?? []
  const hasMore = data?.hasMore ?? false

  const loadMoreGames = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const loadPreviousGames = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1))
  }

  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="text-3xl font-bold">Most Popular</h1>
      {games && games.length > 0 ? (
        <>
          <Grid games={games} />
          <LoadMore
            page={page}
            hasMore={hasMore}
            isLoading={loading}
            onLoadMore={loadMoreGames}
            onLoadPrevious={loadPreviousGames}
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

export default Mpop
