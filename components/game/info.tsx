import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Game, ScreenshotItem } from "@/lib/game-types";
import { rawgImage } from "@/lib/rawg-image";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

function BadgeList({ heading, values }: { heading: string; values: string[] }) {
  return (
    <div>
      <h2 className="p-1 font-semibold text-md md:text-lg lg:text-xl">{heading}</h2>
      <ul className="flex flex-wrap gap-2">
        {values.map((value) => (
          <li key={value}>
            <Badge variant="secondary">{value}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

type InfoProps = {
  game: Game;
  screenshots: ScreenshotItem[];
};

export function Info({ game, screenshots }: InfoProps) {
  const { description_raw, platforms, developers, publishers } = game;

  return (
    <div>
      <div className="mt-6 flex flex-col space-y-10 lg:flex-row lg:space-x-4 lg:space-y-0">
        <article className="flex-1 space-y-4 p-6 backdrop-blur-lg">
          <h2 className="font-semibold text-lg md:text-xl lg:text-2xl">Description</h2>
          <p className="scrollbar-thin h-40 overflow-y-scroll whitespace-pre-line md:h-60">
            {(description_raw ?? "").split("###").join("\n\n").trim()}
          </p>
        </article>

        <div className="space-y-4 p-6 backdrop-blur-sm lg:max-w-md">
          <BadgeList
            heading="Platforms"
            values={(platforms ?? []).map((entry) => entry.platform.name)}
          />
          <BadgeList
            heading="Developers"
            values={(developers ?? []).map((developer) => developer.name)}
          />
          <BadgeList
            heading="Publishers"
            values={(publishers ?? []).map((publisher) => publisher.name)}
          />
        </div>
      </div>

      <div className="my-6 space-y-4 p-6">
        <h2 className="font-semibold text-lg md:text-xl lg:text-2xl">Screenshots</h2>
        <div className="scrollbar-thin grid h-80 grid-cols-1 gap-4 overflow-y-scroll drop-shadow-lg md:h-auto md:max-h-100 md:grid-cols-3">
          {screenshots.map((screenshot) => (
            <Image
              key={screenshot.id}
              src={rawgImage(screenshot.image || PLACEHOLDER_IMAGE, 1280)}
              alt={`${game.name} screenshot`}
              width={screenshot.width}
              height={screenshot.height}
              sizes="(min-width: 768px) 33vw, 100vw"
              className="w-full object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
