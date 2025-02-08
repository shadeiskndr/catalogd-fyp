"use client"
import GenreCards from "@/components/genres/GenreCards"
import { useGenreList } from "@/hooks/use-games-extended"
import { BeatLoader } from "react-spinners"

const Genre = () => {
  const { data: genreData, isLoading } = useGenreList()
  const genres = genreData?.results || []

  return (
    <div className="relative space-y-8">
      <h1 className="text-3xl font-bold">Genres</h1>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      ) : genres.length > 0 ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
          gap-2 md:gap-4 place-items-center"
        >
          {genres.map((genre) => (
            <GenreCards
              key={genre.id}
              name={genre.name}
              image={genre.image_background}
              listSlug={genre.slug}
            />
          ))}
        </div>
      ) : (
        <p>No genres found</p>
      )}
    </div>
  )
}

export default Genre
