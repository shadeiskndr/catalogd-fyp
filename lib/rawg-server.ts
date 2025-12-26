import "server-only";
import { fetchAction } from "convex/nextjs";
import { cacheLife } from "next/cache";
import { api } from "@/convex/_generated/api";

export async function rawgFetchServer<T>(endpoint: string): Promise<T> {
  "use cache";
  cacheLife("hours");
  return (await fetchAction(api.rawg.getPublic, { endpoint })) as T;
}
