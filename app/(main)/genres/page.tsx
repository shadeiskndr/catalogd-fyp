"use client";

import { GenreCard } from "@/components/genres/genre-card";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import { Spinner } from "@/components/ui/spinner";
import { useGenreList } from "@/hooks/use-genres";

export default function GenresPage() {
  const { data, isLoading } = useGenreList();
  const genres = data?.results ?? [];

  return (
    <div className="relative space-y-8 px-2 py-4">
      <BlurFade inView>
        <h1 className="font-bold text-3xl">Genres</h1>
      </BlurFade>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
      {!isLoading && genres.length === 0 ? <p>No genres found.</p> : null}
      {genres.length > 0 && (
        <div className="grid grid-cols-2 place-items-center gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {genres.map((genre, index) => (
            <BlurFade key={genre.id} inView delay={index * 0.05}>
              <GenreCard name={genre.name} image={genre.image_background} slug={genre.slug} />
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}
