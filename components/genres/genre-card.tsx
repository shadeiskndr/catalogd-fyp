import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <Link
        href={`/genres/${slug}`}
        style={{
          backgroundImage: `url(${image || "/imgs/img-placeholder.jpg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-900/70 transition-colors duration-300 hover:bg-gray-900/40">
          <span className="font-bold text-gray-100 text-xl">{name}</span>
        </span>
      </Link>
    </Button>
  );
}
