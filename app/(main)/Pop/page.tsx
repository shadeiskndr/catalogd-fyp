"use client"
import Grid from "@/components/Grid"
import LoadMore from "@/components/load-more"
import { usePopularGames } from "@/hooks/use-games"
import { useState } from "react"
import { BeatLoader } from "react-spinners"

const Mpop = () => {
  const [pageNo, setPageNo] = useState<number>(1)
  const {
    data: games,
    isLoading: loading,
    isFetching,
  } = usePopularGames(pageNo, 40)
  const hasNextPage = (games?.length || 0) >= 40

  const handleFetchNextPage = () => {
    setPageNo(pageNo + 1)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Most Popular</h1>
      <div className="flex flex-col justify-center items-center">
        {loading && pageNo === 1 ? (
          <div>
            <BeatLoader color="#ffa600" size={20} loading={true} />
          </div>
        ) : games && games.length > 0 ? (
          <div className="pb-4">
            <Grid games={games} />
            <div className="flex flex-col my-4 justify-center items-center">
              <LoadMore
                hasMore={hasNextPage}
                isLoading={isFetching}
                onLoadMore={handleFetchNextPage}
              />
            </div>
          </div>
        ) : (
          <span className="font-semibold">No games found.</span>
        )}
      </div>
    </div>
  )
}

export default Mpop
