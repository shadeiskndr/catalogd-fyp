"use client"

import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import LoadMore from "@/components/load-more"
import { useUserGameList } from "@/hooks/use-games"

const MyLib = () => {
  const { games, isLoading, isLoadingMore, hasMore, loadMore, error } =
    useUserGameList("library")

  return (
    <div className="space-y-4 py-4 px-2">
      <h1 className="font-extrabold text-3xl">My Library</h1>
      {games.length ? (
        <>
          <Grid games={games} />
          <LoadMore
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={loadMore}
          />
        </>
      ) : !isLoading ? (
        <div className="mt-10">No games found.</div>
      ) : null}
      {isLoading && (
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

export default MyLib
