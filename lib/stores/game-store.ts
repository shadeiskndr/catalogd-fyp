import { create } from "zustand"
import { persist } from "zustand/middleware"

interface GameStore {
  gameAdded: boolean
  setGameAdded: (value: boolean) => void
  // Add more game-related state as needed
  favoriteGames: number[]
  addToFavorites: (gameId: number) => void
  removeFromFavorites: (gameId: number) => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameAdded: false,
      setGameAdded: (value) => set({ gameAdded: value }),
      favoriteGames: [],
      addToFavorites: (gameId) =>
        set((state) => ({
          favoriteGames: [...state.favoriteGames, gameId],
        })),
      removeFromFavorites: (gameId) =>
        set((state) => ({
          favoriteGames: state.favoriteGames.filter((id) => id !== gameId),
        })),
    }),
    {
      name: "game-store",
    },
  ),
)
