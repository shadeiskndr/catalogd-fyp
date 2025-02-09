import Link from "next/link"
import { Button } from "@/components/ui/button"

type GenreCardsProps = {
  name: string
  image: string
  listSlug: string
}

const GenreCards = ({ name, image, listSlug }: GenreCardsProps) => {
  return (
    <Button
      asChild
      variant="ghost"
      className="flex flex-col justify-center items-center rounded-full w-40 h-40 md:w-42 md:h-42 lg:w-52 lg:h-52 p-0"
    >
      <Link
        href={`/genrepage/${listSlug}`}
        style={{
          backgroundImage: `url(${image || "../../public/imgs/imgPlaceholder.jpg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="bg-gray-900/70 w-full h-full hover:bg-gray-900/40 transition-all duration-300 rounded-full flex items-center justify-center">
          <h1 className="text-xl font-bold text-gray-300">{name}</h1>
        </div>
      </Link>
    </Button>
  )
}

export default GenreCards
