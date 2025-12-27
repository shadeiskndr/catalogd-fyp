import "server-only";
import { fetchAction } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function rawgFetchServer<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("hours");
  let lastError: unknown = new Error(`RAWG fetch never ran for "${endpoint}"`);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return (await fetchAction(api.rawg.getPublic, { endpoint })) as T;
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
