import Image from "next/image";
import Link from "next/link";
import { AddButton } from "@/components/add-button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Game } from "@/lib/game-types";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export function GameCard({ game }: { game: Game }) {
  const { slug, id, name, released, background_image, genres } = game;
  const releasedDate = released ? new Date(released).toLocaleDateString() : "TBA";
  const genreList = genres.map((genre) => genre.name).join(", ");

  return (
    <Card className="relative h-full overflow-hidden border-0 p-0 transition-[transform,box-shadow] duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
      <CardContent className="p-0">
        <Image
          src={background_image || PLACEHOLDER_IMAGE}
          alt={name}
          width={800}
          height={400}
          className="h-48 w-full object-cover"
        />
        <CardFooter className="flex flex-row items-start justify-between gap-4 bg-linear-to-t from-primary/50 to-transparent px-4 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-2 font-extrabold text-sm">
              <Link href={`/game/${slug}`} className="after:absolute after:inset-0">
                {name}
              </Link>
            </h3>
            <p className="text-muted-foreground text-xs">{releasedDate}</p>
            <p className="text-muted-foreground text-xs">{genreList}</p>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <AddButton list="library" gameId={id} gameName={name} />
            <AddButton list="wishlist" gameId={id} gameName={name} />
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
