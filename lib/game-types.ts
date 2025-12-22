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
