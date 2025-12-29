import Image from "next/image";
import Link from "next/link";
import { AddButton } from "@/components/add-button";
import { MetacriticBadge } from "@/components/metacritic-badge";
import { Card } from "@/components/ui/card";
import { formatReleaseYear } from "@/lib/format";
import type { Game } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export function CarouselCard({
  game,
  sizes,
  eager = false,
}: {
  game: Game;
  sizes: string;
  eager?: boolean;
}) {
  const { slug, id, name, released, background_image, metacritic } = game;

  return (
    <Card className="ease relative flex h-full flex-col gap-0 overflow-hidden p-0 transition-[border-color,box-shadow] duration-150 hover-hover:hover:border-ring/60 hover-hover:hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={rawgImage(background_image || PLACEHOLDER_IMAGE, 1280)}
          alt={name}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-card to-transparent" />
        {metacritic > 0 ? (
          <MetacriticBadge score={metacritic} className="absolute top-2 right-2" />
        ) : null}
      </div>

      <div className="flex flex-1 items-end justify-between gap-2 p-4 pt-3">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 font-semibold text-sm leading-snug">
            <Link
              href={`/game/${slug}`}
              prefetch
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {name}
            </Link>
          </h3>
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatReleaseYear(released)}
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <AddButton list="wishlist" gameId={id} gameName={name} />
        </div>
      </div>
    </Card>
  );
}
