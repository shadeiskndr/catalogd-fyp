"use client";

import { useQuery } from "@tanstack/react-query";
import type { Game } from "@/lib/game-types";
import { type GenreSummary, type ResponseSchema, rawgFetch } from "@/lib/rawg-client";

const MINUTE = 60 * 1000;

export const genreKeys = {
  all: ["genres"] as const,
  list: () => [...genreKeys.all, "list"] as const,
  games: (slug: string, page: number) => [...genreKeys.all, "games", slug, page] as const,
};

export function useGenreList() {
  return useQuery({
    queryKey: genreKeys.list(),
    queryFn: () => rawgFetch<ResponseSchema<GenreSummary>>("genres"),
    staleTime: 30 * MINUTE,
  });
}

export function useGenreGames(genreSlug: string, page = 1, pageSize = 20, ordering = "-added") {
  return useQuery({
    queryKey: genreKeys.games(genreSlug, page),
    queryFn: async () => {
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games?discover=true&page-size=${pageSize}&ordering=${ordering}&page=${page}&genres=${genreSlug}`
      );
      const games = Array.from(new Map(data.results.map((game) => [game.id, game])).values());
      return { games, hasMore: games.length >= pageSize };
    },
    enabled: genreSlug.length > 0,
    staleTime: 5 * MINUTE,
    placeholderData: (previousData) => previousData,
  });
}
