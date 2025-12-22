import Image from "next/image";
import { AddButtonFull } from "@/components/add-button-full";
import type { Game } from "@/lib/game-types";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export function Banner({ game }: { game: Game }) {
  return (
    <div className="relative">
      <div className="absolute inset-0">
        <Image
          className="h-full w-full object-cover object-top"
          src={game.background_image || PLACEHOLDER_IMAGE}
          alt={`${game.name} cover art`}
          fill
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black to-transparent" />
      </div>
      <div className="flex justify-between">
        <div className="relative max-w-7xl px-8 pt-24 pb-8 md:pt-32 lg:pt-40">
          <h1 className="font-extrabold text-4xl text-gray-200 tracking-tight sm:text-5xl lg:text-6xl">
            {game.name}
          </h1>
          <p className="mt-6 max-w-3xl text-gray-300 text-xl">
            {game.genres.map((genre) => genre.name).join(", ")}
          </p>
          <p className="mt-1 max-w-3xl text-gray-300 text-xl">
            Metacritic Rating: {game.metacritic ?? "N/A"}
          </p>
          <p className="mt-1 max-w-3xl text-gray-300 text-md">
            Release Date: {game.released ? new Date(game.released).toLocaleDateString() : "TBA"}
          </p>
        </div>
        <div className="relative z-10 flex flex-col justify-end space-y-4 px-8 pb-8">
          <AddButtonFull list="library" gameId={game.id} gameName={game.name} />
          <AddButtonFull list="wishlist" gameId={game.id} gameName={game.name} />
        </div>
      </div>
    </div>
  );
}
