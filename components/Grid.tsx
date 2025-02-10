import type { Game } from "@/gameTypes"
import { BlurFade } from "@/components/ui/magicui/blur-fade"
import GameCard from "./GameCard"

interface Props {
  games: Game[]
}

function Grid({ games }: Props) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
      {games.map((game, index) => (
        <BlurFade key={game.id} delay={index * 0.1} inView>
          <GameCard game={game} />
        </BlurFade>
      ))}
    </div>
  )
}

export default Grid
