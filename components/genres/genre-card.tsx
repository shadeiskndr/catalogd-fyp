import Image from "next/image";
import Link from "next/link";
import { catalogImage } from "@/lib/catalog-image";
import { formatCount } from "@/lib/format";

const PLACEHOLDER_IMAGE = "/imgs/img-placeholder.jpg";

export type GenreCardLoading = "priority" | "eager" | "lazy";

type GenreCardProps = {
  name: string;
  image: string;
  slug: string;
  gamesCount: number;
  loadingStrategy?: GenreCardLoading;
};

export function GenreCard({
  name,
  image,
  slug,
  gamesCount,
  loadingStrategy = "lazy",
}: GenreCardProps) {
  return (
    <Link
      href={`/genres/${slug}`}
      prefetch
      className="ease relative flex aspect-4/3 overflow-hidden rounded-xl border bg-muted transition-[border-color,box-shadow] duration-150 hover-hover:hover:border-ring/60 hover-hover:hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]"
    >
      <Image
        src={catalogImage(image || PLACEHOLDER_IMAGE, 600)}
        alt=""
        fill
        sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        {...(loadingStrategy === "priority" ? { priority: true } : { loading: loadingStrategy })}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
      <div className="relative mt-auto w-full space-y-0.5 p-3 md:p-4">
        <h2 className="font-semibold text-sm text-white leading-tight md:text-base">{name}</h2>
        <p className="text-white/70 text-xs tabular-nums">{formatCount(gamesCount)} games</p>
      </div>
    </Link>
  );
}
