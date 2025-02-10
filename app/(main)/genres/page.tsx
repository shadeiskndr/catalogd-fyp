"use client"
import { BeatLoader } from "react-spinners"
import GenreCards from "@/components/genres/GenreCards"
import { BlurFade } from "@/components/ui/magicui/blur-fade"
import { useGenreList } from "@/hooks/use-games-extended"

const Genre = () => {
  const { data: genreData, isLoading } = useGenreList()
  const genres = genreData?.results || []

  return (
    <div className="relative space-y-8 py-4 px-2">
      <BlurFade inView>
        <h1 className="text-3xl font-bold">Genres</h1>
      </BlurFade>
      {isLoading ? (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      ) : genres.length > 0 ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
          gap-2 md:gap-4 place-items-center"
        >
          {genres.map((genre, index) => (
            <BlurFade key={genre.id} inView delay={index * 0.05}>
              <GenreCards
                name={genre.name}
                image={genre.image_background}
                listSlug={genre.slug}
              />
            </BlurFade>
          ))}
        </div>
      ) : (
        <p>No genres found</p>
      )}
    </div>
  )
}

export default Genre
