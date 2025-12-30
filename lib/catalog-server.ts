import "server-only";
import { fetchAction } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";
import type { CatalogGame, CatalogGenre, CatalogList } from "@/lib/game-types";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: unknown = new Error(`Catalog fetch never ran for "${label}"`);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

export async function getGameList(key: string): Promise<CatalogList> {
  "use cache";
  cacheLife("hours");
  return await withRetry(key, () => fetchAction(api.catalog.ensureList, { key }));
}

export async function getGameDetail(slug: string): Promise<CatalogGame | null> {
  "use cache";
  cacheLife("hours");
  return await withRetry(slug, () => fetchAction(api.catalog.ensureGame, { slug }));
}

export async function getGenres(): Promise<CatalogGenre[]> {
  "use cache";
  cacheLife("hours");
  return await withRetry("genres", () => fetchAction(api.catalog.ensureGenres, {}));
}
