import { normalizeRawgMediaPath, rawgMasterUrl } from "@/lib/rawg-image-path";

const siteUrl = process.env["NEXT_PUBLIC_CONVEX_SITE_URL"];

export function catalogImage(url: string): string {
  const path = normalizeRawgMediaPath(url);
  if (path === null) {
    return url;
  }
  if (siteUrl === undefined || siteUrl.length === 0) {
    return rawgMasterUrl(path);
  }
  return `${siteUrl.replace(/\/$/, "")}/img/${path}`;
}
