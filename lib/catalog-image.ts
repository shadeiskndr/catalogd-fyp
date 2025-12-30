import { type ImageWidth, normalizeRawgMediaPath, rawgVariantUrl } from "@/lib/rawg-image-path";

const siteUrl = process.env["NEXT_PUBLIC_CONVEX_SITE_URL"];

export type { ImageWidth };

export function catalogImage(url: string, width: ImageWidth): string {
  const path = normalizeRawgMediaPath(url);
  if (path === null) {
    return url;
  }
  if (siteUrl === undefined || siteUrl.length === 0) {
    return rawgVariantUrl(path, width);
  }
  return `${siteUrl.replace(/\/$/, "")}/img/${width}/${path}`;
}
