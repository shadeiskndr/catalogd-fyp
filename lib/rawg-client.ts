import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex-client";

export async function rawgFetch<T>(endpoint: string): Promise<T> {
  return (await convexClient.action(api.rawg.get, { endpoint })) as T;
}

export async function rawgFetchMany<T>(endpoints: string[]): Promise<T[]> {
  return (await convexClient.action(api.rawg.getMany, { endpoints })) as T[];
}
