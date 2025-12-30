export const RAWG_MEDIA_PREFIX = "https://media.rawg.io/media/";
export const RAWG_MEDIA_ORIGIN = "https://media.rawg.io";

export const IMAGE_WIDTHS = [200, 420, 600, 640, 1280, 1920] as const;

export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

const VARIANT_PATTERNS = [/^resize\/\d+\/-\//, /^crop\/\d+\/\d+\//];
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9/._-]*$/;
const MAX_PATH_LENGTH = 200;

export function isSafeMediaPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= MAX_PATH_LENGTH &&
    !path.includes("..") &&
    !path.includes("//") &&
    SAFE_PATH.test(path)
  );
}

export function normalizeRawgMediaPath(url: string): string | null {
  if (!url.startsWith(RAWG_MEDIA_PREFIX)) {
    return null;
  }
  let path = url.slice(RAWG_MEDIA_PREFIX.length);
  for (const pattern of VARIANT_PATTERNS) {
    path = path.replace(pattern, "");
  }
  return isSafeMediaPath(path) ? path : null;
}

export function isImageWidth(value: number): value is ImageWidth {
  return (IMAGE_WIDTHS as readonly number[]).includes(value);
}

export function rawgVariantUrl(sourcePath: string, width: ImageWidth): string {
  return `${RAWG_MEDIA_PREFIX}resize/${width}/-/${sourcePath}`;
}
