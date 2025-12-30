export type CatalogScreenshot = {
  id: number;
  image: string;
};

export type CatalogGame = {
  rawgId: number;
  slug: string;
  name: string;
  released: string;
  backgroundImage: string;
  metacritic: number;
  ratingsCount: number;
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  descriptionRaw: string;
  website: string;
  screenshots: CatalogScreenshot[];
  hasDetail: boolean;
};

export type CatalogGenre = {
  rawgId: number;
  slug: string;
  name: string;
  gamesCount: number;
  imageBackground: string;
};

export type CatalogList = {
  games: CatalogGame[];
  count: number;
};
