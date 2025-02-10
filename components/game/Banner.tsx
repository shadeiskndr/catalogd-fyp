import Image from "next/image"
import AddButtonFull from "../AddButtonFull"

type BannerProps = {
  bannerImg: string
  gameName: string
  gameRating: number
  gameReleaseDate: string
  gameGenres: { name: string }[]
  gameId: number
}

const Banner = ({
  bannerImg,
  gameName,
  gameRating,
  gameReleaseDate,
  gameGenres,
  gameId,
}: BannerProps) => {
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-0">
          <Image
            className="w-full h-full object-cover object-top"
            src={bannerImg}
            alt="gameImg"
            fill
          />
          <div className="absolute inset-0 bg-linear-to-r from-black to-transparent" />
        </div>
        <div className="flex justify-between">
          <div className="relative max-w-7xl px-8 pt-24 pb-8 md:pt-32 lg:pt-40">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-gray-200">
              {gameName}
            </h1>
            <p className="mt-6 text-xl max-w-3xl text-gray-300">
              {gameGenres.map((genre) => genre.name).join(", ")}
            </p>
            <h2 className="mt-1 text-xl max-w-3xl text-gray-300">
              Metacritic Rating: {gameRating}
            </h2>
            <h2 className="mt-1 text-md max-w-3xl text-gray-300">
              Release Date: {new Date(gameReleaseDate).toLocaleDateString()}
            </h2>
          </div>
          <div className="z-50 flex flex-col justify-end pb-8 px-8 space-y-4">
            <AddButtonFull
              collection="mylib"
              gameId={gameId}
              gameName={gameName}
            />
            <AddButtonFull
              collection="wishlist"
              gameId={gameId}
              gameName={gameName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Banner
