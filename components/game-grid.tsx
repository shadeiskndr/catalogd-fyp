import { GameCard } from "@/components/game-card";
import { GAME_GRID_CLASSES } from "@/components/game-grid-classes";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import type { CatalogGame } from "@/lib/game-types";

const STAGGER_STEP = 0.04;
const STAGGER_CAP = 7;

export function GameGrid({ games }: { games: CatalogGame[] }) {
  return (
    <div className={GAME_GRID_CLASSES}>
      {games.map((game, index) => (
        <BlurFade key={game.rawgId} delay={Math.min(index, STAGGER_CAP) * STAGGER_STEP} inView>
          <GameCard game={game} priority={index < 4} />
        </BlurFade>
      ))}
    </div>
  );
}
