const RAWG_API_URL = "https://api.rawg.io/api/";
const RAWG_API_ORIGIN = "https://api.rawg.io";
const CONSOLE_PLATFORMS = "1,7,18,187,186,16,17,14";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const MAX_SLUG_LENGTH = 120;
const MAX_LIST_PAGE = 100;

export type RawgNamed = { name?: string | null };
export type RawgPlatformEntry = { platform?: RawgNamed | null };
export type RawgScreenshot = { id?: number | null; image?: string | null };

export type RawgGame = {
  id?: number | null;
  slug?: string | null;
  name?: string | null;
  released?: string | null;
  background_image?: string | null;
  metacritic?: number | null;
  ratings_count?: number | null;
  description_raw?: string | null;
  website?: string | null;
  genres?: RawgNamed[] | null;
  platforms?: RawgPlatformEntry[] | null;
  parent_platforms?: RawgPlatformEntry[] | null;
  developers?: RawgNamed[] | null;
  publishers?: RawgNamed[] | null;
  short_screenshots?: RawgScreenshot[] | null;
};

export type RawgGenre = {
  id?: number | null;
  slug?: string | null;
  name?: string | null;
  games_count?: number | null;
  image_background?: string | null;
};

export type RawgListResponse<T> = { count?: number | null; results?: T[] | null };

function stripPaginationUrls(data: unknown): unknown {
  if (data === null || typeof data !== "object") {
    return data;
  }
  const record = data as Record<string, unknown>;
  if (!("next" in record) && !("previous" in record)) {
    return data;
  }
  return { ...record, next: null, previous: null };
}

export function isValidSlug(value: string): boolean {
  return value.length > 0 && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

function parsePage(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9][0-9]*$/.test(value)) {
    return null;
  }
  const page = Number.parseInt(value, 10);
  return page <= MAX_LIST_PAGE ? page : null;
}

export const LIST_PAGE_SIZE = 12;
export const UPCOMING_PAGE_SIZE = 8;
export const FEATURED_PAGE_SIZE = 30;

export function resolveListEndpoint(key: string): string | null {
  const parts = key.split(":");
  const kind = parts[0];

  if (kind === "genre") {
    if (parts.length !== 3) {
      return null;
    }
    const slug = parts[1] ?? "";
    const page = parsePage(parts[2]);
    if (page === null || !isValidSlug(slug)) {
      return null;
    }
    return `games?discover=true&page-size=${LIST_PAGE_SIZE}&ordering=popularity&page=${page}&genres=${slug}`;
  }

  if (parts.length !== 2) {
    return null;
  }
  const page = parsePage(parts[1]);
  if (page === null) {
    return null;
  }

  if (kind === "popular") {
    return `games/lists/popular?discover=true&page=${page}&page-size=${LIST_PAGE_SIZE}&ordering=popularity`;
  }
  if (kind === "new-releases") {
    return `games/lists/main?&page=${page}&ordering=-released&page-size=${LIST_PAGE_SIZE}`;
  }
  if (kind === "upcoming") {
    return `games/lists/main?&page-size=${UPCOMING_PAGE_SIZE}&ordering=-released&page=${page}`;
  }
  if (kind === "featured") {
    return `games/lists/popular?discover=true&page-size=${FEATURED_PAGE_SIZE}&page=${page}`;
  }
  return null;
}

async function rawgResponse(endpoint: string): Promise<Response> {
  const apiKey = process.env["RAWG_API_KEY"];
  if (!apiKey) {
    throw new Error("RAWG_API_KEY is not set on the Convex deployment");
  }

  const isGameEndpoint = endpoint.includes("games");
  const separator = endpoint.includes("?") ? "&" : "?";
  const platformFilter = isGameEndpoint ? `&platforms=${CONSOLE_PLATFORMS}` : "";
  const url = new URL(`${endpoint}${separator}key=${apiKey}${platformFilter}`, RAWG_API_URL);
  if (url.origin !== RAWG_API_ORIGIN || !url.pathname.startsWith("/api/")) {
    throw new Error("Invalid RAWG endpoint");
  }
  return await fetch(url.toString());
}

export async function rawgRequest<T>(endpoint: string): Promise<T> {
  const response = await rawgResponse(endpoint);
  if (!response.ok) {
    throw new Error(`RAWG API Error: ${response.status} ${response.statusText}`);
  }
  return stripPaginationUrls(await response.json()) as T;
}

export async function rawgRequestOptional<T>(endpoint: string): Promise<T | null> {
  const response = await rawgResponse(endpoint);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`RAWG API Error: ${response.status} ${response.statusText}`);
  }
  return stripPaginationUrls(await response.json()) as T;
}
