import Image from "next/image"
import type { Game } from "@/gameTypes"
import type { ScreenshotItem } from "@/lib/rawg-client"
import imgPlace from "../../public/imgs/imgPlaceholder.jpg"
import { Badge } from "@/components/ui/badge"

type InfoProps = {
  game: Game
  screenshots: ScreenshotItem[]
}

const Info = ({ game, screenshots }: InfoProps) => {
  const { description_raw, platforms, developers, publishers } = game
  return (
    <div>
      <div className="flex flex-col lg:flex-row space-y-10 lg:space-y-0 lg:space-x-4 mt-6 ">
        <article className=" flex-1 p-6 space-y-4 backdrop-blur-lg">
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
            Description
          </h1>
          <div className="h-40 md:h-60 overflow-y-scroll scrollbar-thin">
            {description_raw.split("###").map((p, index) => (
              <p key={index}>{p}</p>
            ))}
          </div>
        </article>

        {/*Details*/}
        <div className="p-6 space-y-4 lg:max-w-md backdrop-blur-sm">
          <div>
            <h1 className="text-md md:text-lg lg:text-xl font-semibold p-1">
              Platforms
            </h1>
            <ul className="flex flex-wrap gap-2">
              {platforms?.map((platform, index) => (
                <li key={index}>
                  <Badge variant="secondary">{platform.platform.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h1 className="text-md md:text-lg lg:text-xl font-semibold p-1">
              Developers
            </h1>
            <ul className="flex flex-wrap gap-2">
              {developers?.map((developer, index) => (
                <li key={index}>
                  <Badge variant="secondary">{developer.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h1 className="text-md md:text-lg lg:text-xl font-semibold p-1">
              Publishers
            </h1>
            <ul className="flex flex-wrap gap-2">
              {publishers?.map((publisher, index) => (
                <li key={index}>
                  <Badge variant="secondary">{publisher.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/*Screenshots*/}
      <div className="space-y-4 p-6 my-6">
        <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
          Screenshots
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 drop-shadow-lg gap-4 h-80 md:h-auto md:max-h-100 overflow-y-scroll scrollbar-thin">
          {screenshots?.map((screenshot) => (
            <Image
              key={screenshot.id}
              src={screenshot?.image ? screenshot.image : imgPlace}
              alt={screenshot.id.toString()}
              width={screenshot.width}
              height={screenshot.height}
              className="w-full object-cover"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Info
