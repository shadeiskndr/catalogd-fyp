export type Platform = {
  platform: {
    id: number;
    slug: string;
    name: string;
  };
};

export type Game = {
  id: number;
  slug: string;
  name: string;
  price: number;
  ratings_count: number;
  description_raw: string;
  website: string;
  released: string;
  background_image: string;
  metacritic: number;
  developers: { name: string }[];
  publishers: { name: string }[];
  parent_platforms: Platform[];
  platforms: Platform[];
  genres: { name: string }[];
  short_screenshots: { id: number; image: string }[];
};

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

export interface ScreenshotItem {
  id: number;
  image: string;
  width: number;
  height: number;
  is_deleted: boolean;
}

export type Screenshot = ResponseSchema<ScreenshotItem>;

export function dedupeById(games: Game[]): Game[] {
  return Array.from(new Map(games.map((game) => [game.id, game])).values());
}
