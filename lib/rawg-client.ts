import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex-client";

export async function rawgFetch<T>(endpoint: string): Promise<T> {
  return (await convexClient.action(api.rawg.get, { endpoint })) as T;
}

export interface ResponseSchema<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface GenreSummary {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
  description: string;
}

export interface Screenshot {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScreenshotItem[];
}

export interface ScreenshotItem {
  id: number;
  image: string;
  width: number;
  height: number;
  is_deleted: boolean;
}
