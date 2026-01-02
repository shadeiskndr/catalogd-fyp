import type { CatalogGame } from "@/lib/game-types";

export type RagFilters = {
  genres?: string[];
  platforms?: string[];
  tags?: string[];
  minMetacritic?: number;
  maxPlaytime?: number;
  releasedAfter?: string;
  releasedBefore?: string;
};

export type RagResult = CatalogGame & { score: number };

export type RecommendResult = { source: "taste" | "popular"; games: RagResult[] };

function anyMatch(haystack: readonly string[], needles: readonly string[]): boolean {
  if (needles.length === 0) {
    return true;
  }
  const lowered = haystack.map((value) => value.toLowerCase());
  return needles.some((needle) => {
    const wanted = needle.trim().toLowerCase();
    return wanted.length > 0 && lowered.some((value) => value.includes(wanted));
  });
}

export function passesRagFilters(game: CatalogGame, filters: RagFilters | undefined): boolean {
  if (filters === undefined) {
    return true;
  }
  if (!anyMatch(game.genres, filters.genres ?? [])) {
    return false;
  }
  if (!anyMatch(game.platforms, filters.platforms ?? [])) {
    return false;
  }
  if (!anyMatch(game.tags, filters.tags ?? [])) {
    return false;
  }
  if (filters.minMetacritic !== undefined && game.metacritic < filters.minMetacritic) {
    return false;
  }
  if (
    filters.maxPlaytime !== undefined &&
    (game.playtime === 0 || game.playtime > filters.maxPlaytime)
  ) {
    return false;
  }
  if (filters.releasedAfter !== undefined && game.released < filters.releasedAfter) {
    return false;
  }
  if (
    filters.releasedBefore !== undefined &&
    (game.released.length === 0 || game.released > filters.releasedBefore)
  ) {
    return false;
  }
  return true;
}
