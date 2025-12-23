import { CarouselCard } from "@/components/dashboard/carousel-card";
import { Marquee } from "@/components/ui/magicui/marquee";
import { Skeleton } from "@/components/ui/skeleton";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

const CARD_SIZES = "288px";

export function UpcomingSkeleton() {
  const placeholders = Array.from({ length: 6 }, (_, index) => `upcoming-${index}`);

  return (
    <div className="flex gap-4 overflow-hidden py-8">
      {placeholders.map((placeholder) => (
        <Skeleton key={placeholder} className="h-72 w-72 shrink-0 rounded-xl" />
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
    return <p>No games found.</p>;
  }

  return (
    <div className="-mx-[calc((100vw-100%)/2)] w-screen overflow-hidden">
      <Marquee className="py-8" pauseOnHover repeat={2}>
        {games.map((game) => (
          <div key={game.id} className="w-72 shrink-0">
            <CarouselCard game={game} sizes={CARD_SIZES} />
          </div>
        ))}
      </Marquee>
    </div>
  );
}
