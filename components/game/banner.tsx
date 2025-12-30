import { Building2, CalendarDays, Gamepad2 } from "lucide-react";
import Image from "next/image";
import { AddButtonFull } from "@/components/add-button-full";
import { catalogImage } from "@/lib/catalog-image";
import { formatReleaseDate } from "@/lib/format";
import type { CatalogGame } from "@/lib/game-types";
import { metacriticSurfaceTone } from "@/lib/review-rating";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export function Banner({ game }: { game: CatalogGame }) {
  const genres = game.genres;
  const developer = game.developers[0];

  return (
    <div className="relative -mx-4 overflow-hidden md:-mx-6">
      <div className="absolute inset-0">
        <Image
          className="object-cover object-top"
          src={catalogImage(game.backgroundImage || PLACEHOLDER_IMAGE, 1920)}
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/25" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/50 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-6 px-4 pt-24 pb-8 md:px-6 md:pt-36 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0 max-w-3xl space-y-4">
          <h1 className="font-extrabold text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            {game.name}
          </h1>

          {genres.length > 0 ? (
            <ul className="flex flex-wrap items-center gap-1.5">
              {genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-full bg-foreground/10 px-2.5 py-1 font-medium text-foreground/90 text-xs backdrop-blur-sm"
                >
                  {genre}
                </li>
              ))}
            </ul>
          ) : null}

          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                <span className="sr-only">Release date</span>
              </dt>
              <dd className="tabular-nums">{formatReleaseDate(game.released)}</dd>
            </div>

            {game.metacritic > 0 ? (
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">Metacritic</dt>
                <dd
                  className={cn(
                    "rounded-md bg-foreground/10 px-1.5 py-0.5 font-bold tabular-nums",
                    metacriticSurfaceTone(game.metacritic)
                  )}
                >
                  {game.metacritic}
                </dd>
              </div>
            ) : null}

            {developer === undefined ? null : (
              <div className="flex min-w-0 items-center gap-1.5">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Developer</span>
                </dt>
                <dd className="truncate">{developer}</dd>
              </div>
            )}

            {game.platforms.length === 0 ? null : (
              <div className="flex items-center gap-1.5">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Gamepad2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Platforms</span>
                </dt>
                <dd className="tabular-nums">{game.platforms.length} platforms</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <AddButtonFull list="library" gameId={game.rawgId} gameName={game.name} />
          <AddButtonFull list="wishlist" gameId={game.rawgId} gameName={game.name} />
        </div>
      </div>
    </div>
  );
}
