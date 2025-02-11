import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Game } from "@/gameTypes"
import AddButton from "../AddButton"

type CarouselCardProps = {
  game: Game
}

const CarouselCard = ({ game }: CarouselCardProps) => {
  const { slug, id, name, released, background_image } = game
  const releasedDate = new Date(released).getFullYear()
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
          src={background_image}
          alt={name}
          width={800}
          height={400}
          className="w-full h-48 object-cover"
          placeholder="blur"
          blurDataURL={background_image}
        />
        <CardFooter className="flex justify-between items-end gap-4 py-4 px-4 bg-linear-to-t from-primary/50 to-transparent">
          <div className="space-y-1 min-w-0">
            <h3 className="font-extrabold text-sm line-clamp-2">{name}</h3>
            <p className="text-xs text-muted-foreground">{releasedDate}</p>
          </div>
          <AddButton collection="wishlist" gameId={id} gameName={name} />
        </CardFooter>
      </CardContent>
    </Card>
  )
}

export default CarouselCard
