import { CarouselCard } from "@/components/dashboard/carousel-card";
import { Marquee } from "@/components/ui/magicui/marquee";
import { Skeleton } from "@/components/ui/skeleton";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

const CARD_SIZES = "(min-width: 640px) 288px, 256px";
const CARD_CLASSES = "w-64 shrink-0 sm:w-72";
const EAGER_COUNT = 4;

export function UpcomingSkeleton() {
  const placeholders = Array.from({ length: 6 }, (_, index) => `upcoming-${index}`);

  return (
    <div className="flex gap-4 overflow-hidden">
      {placeholders.map((placeholder) => (
        <div
          key={placeholder}
          className={`${CARD_CLASSES} overflow-hidden rounded-xl border bg-card`}
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4 pt-3">
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function Upcoming() {
  const data = await rawgFetchServer<ResponseSchema<Game>>(
    "games/lists/main?&page-size=8&ordering=-released&page=1"
  );
  const games = dedupeById(data.results);

  if (games.length === 0) {
    return <p className="text-muted-foreground">No games found.</p>;
  }

  return (
    <div className="edge-fade-x -mx-4 px-4 [--edge-fade:2rem] md:-mx-6 md:px-6 md:[--edge-fade:4rem]">
      <Marquee className="py-1 [--gap:1rem]" pauseOnHover repeat={2}>
        {games.map((game, index) => (
          <div key={game.id} className={CARD_CLASSES}>
            <CarouselCard game={game} sizes={CARD_SIZES} eager={index < EAGER_COUNT} />
          </div>
        ))}
      </Marquee>
    </div>
  );
}
