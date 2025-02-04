import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Game } from "@/gameTypes"
import AddButton from "./AddButton"

type GameCardProps = {
  game: Game
}

const GameCard = ({ game }: GameCardProps) => {
  const { slug, id, name, released, background_image, genres } = game
  const releasedDate = new Date(released).toLocaleDateString()
  const genreList = genres.map((genre) => genre.name).join(", ")
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/game/${slug}`)
  }

  return (
    <Card
      className="overflow-hidden h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 border-0 cursor-pointer p-0"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-0">
        <Image
          src={
            background_image ||
            "https://via.placeholder.com/800x400?text=Placeholder+Image"
          }
          alt={name}
          width={800}
          height={400}
          className="w-full h-48 object-cover"
          placeholder="blur"
          blurDataURL={
            background_image ||
            "https://via.placeholder.com/800x400?text=Placeholder+Image"
          }
        />
        <CardFooter className="flex flex-col gap-4 py-4 px-4 bg-linear-to-t from-primary/50 to-transparent">
          <div className="flex justify-between w-full gap-2">
            <AddButton collection="mylib" gameId={id} gameName={name} />
            <AddButton collection="wishlist" gameId={id} gameName={name} />
          </div>
          <div className="space-y-1 w-full">
            <h3 className="font-extrabold text-sm line-clamp-2">{name}</h3>
            <p className="text-xs text-muted-foreground">{releasedDate}</p>
            <p className="text-xs text-muted-foreground">{genreList}</p>
          </div>
        </CardFooter>
      </CardContent>
    </Card>
  )
}

export default GameCard
