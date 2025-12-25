import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { rawgImage } from "@/lib/rawg-image";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

type GenreCardProps = {
  name: string;
  image: string;
  slug: string;
};

export function GenreCard({ name, image, slug }: GenreCardProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className="flex h-40 w-40 flex-col items-center justify-center rounded-full p-0 md:h-42 md:w-42 lg:h-52 lg:w-52"
    >
      <Link href={`/genres/${slug}`} className="relative overflow-hidden">
        <Image
          src={rawgImage(image || PLACEHOLDER_IMAGE, 420)}
          alt=""
          fill
          sizes="(min-width: 1024px) 208px, (min-width: 768px) 168px, 160px"
          loading="eager"
          className="object-cover"
        />
        <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gray-900/70 transition-colors duration-300 hover:bg-gray-900/40">
          <span className="font-bold text-gray-100 text-xl">{name}</span>
        </span>
      </Link>
    </Button>
  );
}
