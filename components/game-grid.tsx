import { GameCard } from "@/components/game-card";
import { BlurFade } from "@/components/ui/magicui/blur-fade";
import type { Game } from "@/lib/game-types";

export function GameGrid({ games }: { games: Game[] }) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game, index) => (
        <BlurFade key={game.id} delay={index * 0.1} inView>
          <GameCard game={game} />
        </BlurFade>
      ))}
    </div>
  );
}
