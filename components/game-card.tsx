import Image from "next/image";
import Link from "next/link";
import { AddButton } from "@/components/add-button";
import { MetacriticBadge } from "@/components/metacritic-badge";
import { Card } from "@/components/ui/card";
import { formatReleaseDate } from "@/lib/format";
import type { Game } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";
const MAX_GENRES = 2;

export function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  const { slug, id, name, released, background_image, genres, metacritic } = game;
  const shownGenres = genres.slice(0, MAX_GENRES);
  const extraGenres = genres.length - shownGenres.length;

  return (
    <Card className="ease relative flex h-full flex-col gap-0 overflow-hidden p-0 transition-[border-color,box-shadow] duration-150 hover-hover:hover:border-ring/60 hover-hover:hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={rawgImage(background_image || PLACEHOLDER_IMAGE, 1280)}
          alt={name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-card to-transparent" />
        {metacritic > 0 ? (
          <MetacriticBadge score={metacritic} className="absolute top-2 right-2" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <h3 className="line-clamp-2 font-semibold text-sm leading-snug">
          <Link
            href={`/game/${slug}`}
            prefetch
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {name}
          </Link>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatReleaseDate(released)}
            </p>
            {shownGenres.length > 0 ? (
              <ul className="flex flex-wrap items-center gap-1">
                {shownGenres.map((genre) => (
                  <li
                    key={genre.name}
                    className="rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] text-secondary-foreground leading-4"
                  >
                    {genre.name}
                  </li>
                ))}
                {extraGenres > 0 ? (
                  <li className="text-[0.6875rem] text-muted-foreground leading-4">
                    +{extraGenres}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-0.5">
            <AddButton list="library" gameId={id} gameName={name} />
            <AddButton list="wishlist" gameId={id} gameName={name} />
          </div>
        </div>
      </div>
    </Card>
  );
}
