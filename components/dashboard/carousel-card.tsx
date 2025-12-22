import Image from "next/image";
import Link from "next/link";
import { AddButton } from "@/components/add-button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Game } from "@/lib/game-types";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export function CarouselCard({ game }: { game: Game }) {
  const { slug, id, name, released, background_image } = game;
  const releasedYear = released ? new Date(released).getFullYear() : "TBA";

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
        <CardFooter className="flex items-end justify-between gap-4 bg-linear-to-t from-primary/50 to-transparent px-4 py-4">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 font-extrabold text-sm">
              <Link href={`/game/${slug}`} className="after:absolute after:inset-0">
                {name}
              </Link>
            </h3>
            <p className="text-muted-foreground text-xs">{releasedYear}</p>
          </div>
          <div className="relative z-10">
            <AddButton list="wishlist" gameId={id} gameName={name} />
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  );
}
