const RAWG_MEDIA = "https://media.rawg.io/media/";

const RAWG_VARIANT_PREFIXES = ["resize/", "crop/"];

export type RawgImageWidth = 200 | 420 | 600 | 640 | 1280 | 1920;

export function rawgImage(url: string, width: RawgImageWidth): string {
  if (!url.startsWith(RAWG_MEDIA)) {
    return url;
  }
  const path = url.slice(RAWG_MEDIA.length);
  if (RAWG_VARIANT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return url;
  }
  return `${RAWG_MEDIA}resize/${width}/-/${path}`;
}
