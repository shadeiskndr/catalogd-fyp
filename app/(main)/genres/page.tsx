import { Suspense } from "react";
import { GenreCard } from "@/components/genres/genre-card";
import { PageHeader } from "@/components/layout/page-header";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenres } from "@/lib/catalog-server";

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5";
const PRIORITY_COUNT = 5;
const EAGER_COUNT = 10;
const STAGGER_STEP = 0.04;
const STAGGER_CAP = 7;

function GenreGridSkeleton() {
  const placeholders = Array.from({ length: 15 }, (_, index) => `genre-skeleton-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <Skeleton key={placeholder} className="aspect-4/3 w-full rounded-xl" />
      ))}
    </div>
  );
}

async function GenreGrid() {
  const genres = await getGenres();

  if (genres.length === 0) {
    return <p className="text-muted-foreground">No genres found.</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {genres.map((genre, index) => (
        <BlurFade key={genre.rawgId} inView delay={Math.min(index, STAGGER_CAP) * STAGGER_STEP}>
          <GenreCard
            name={genre.name}
            image={genre.imageBackground}
            slug={genre.slug}
            gamesCount={genre.gamesCount}
            loadingStrategy={
              index < PRIORITY_COUNT ? "priority" : index < EAGER_COUNT ? "eager" : "lazy"
            }
          />
        </BlurFade>
      ))}
    </div>
  );
}

export default function GenresPage() {
  return (
    <>
      <PageHeader
        title="Genres"
        description="Start from a genre and work your way through the console catalogue."
      />
      <Suspense fallback={<GenreGridSkeleton />}>
        <GenreGrid />
      </Suspense>
    </>
  );
}
