import { GameDescription } from "@/components/game/description";
import { Screenshots } from "@/components/game/screenshots";
import { Badge } from "@/components/ui/badge";
import type { CatalogGame, CatalogScreenshot } from "@/lib/game-types";

function BadgeList({ heading, values }: { heading: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {heading}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <li key={value}>
            <Badge variant="secondary" className="font-normal">
              {value}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

type InfoProps = {
  game: CatalogGame;
  screenshots: CatalogScreenshot[];
};

export function Info({ game, screenshots }: InfoProps) {
  const { descriptionRaw, platforms, developers, publishers } = game;
  const description = descriptionRaw.split("###").join("\n\n").trim();

  return (
    <div className="space-y-8 pt-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-3 rounded-xl border bg-card/70 p-5 backdrop-blur-sm md:p-6">
          <h2 className="font-semibold text-lg">About</h2>
          <GameDescription text={description} />
        </section>

        <aside className="space-y-5 rounded-xl border bg-card/70 p-5 backdrop-blur-sm md:p-6">
          <h2 className="font-semibold text-lg">Details</h2>
          <BadgeList heading="Platforms" values={platforms} />
          <BadgeList heading="Developers" values={developers} />
          <BadgeList heading="Publishers" values={publishers} />
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-semibold text-lg">Screenshots</h2>
          {screenshots.length > 0 ? (
            <span className="text-muted-foreground text-sm tabular-nums">{screenshots.length}</span>
          ) : null}
        </div>
        <Screenshots screenshots={screenshots} gameName={game.name} />
      </section>
    </div>
  );
}
