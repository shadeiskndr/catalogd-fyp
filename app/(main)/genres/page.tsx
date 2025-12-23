import { Suspense } from "react";
import { GenreCard } from "@/components/genres/genre-card";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenreSummary, ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

const GRID_CLASSES =
  "grid grid-cols-2 place-items-center gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4";

function GenreGridSkeleton() {
  const placeholders = Array.from({ length: 12 }, (_, index) => `genre-skeleton-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <Skeleton key={placeholder} className="size-40 rounded-full md:size-42 lg:size-52" />
      ))}
    </div>
  );
}

async function GenreGrid() {
  const data = await rawgFetchServer<ResponseSchema<GenreSummary>>("genres");

  if (data.results.length === 0) {
    return <p>No genres found.</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {data.results.map((genre, index) => (
        <BlurFade key={genre.id} inView delay={Math.min(index, 8) * 0.04}>
          <GenreCard name={genre.name} image={genre.image_background} slug={genre.slug} />
        </BlurFade>
      ))}
    </div>
  );
}

export default function GenresPage() {
  return (
    <div className="relative space-y-8 px-2 py-4">
      <h1 className="font-bold text-3xl">Genres</h1>
      <Suspense fallback={<GenreGridSkeleton />}>
        <GenreGrid />
      </Suspense>
    </div>
  );
}
