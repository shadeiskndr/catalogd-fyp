"use client"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { HeartIcon, MinusCircleIcon } from "@heroicons/react/24/solid"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ID, Query } from "appwrite"
import { toast } from "react-hot-toast"
import { useGameStore } from "@/lib/stores/game-store"
import {
  database,
  databaseId,
  mylibCol,
  userID,
  wishlistCol,
} from "@/utils/appwrite"

type AddButtonProps = {
  collection: string
  gameId: number
  gameName: string
}

const AddButton = ({ collection, gameId, gameName }: AddButtonProps) => {
  const { setGameAdded } = useGameStore()
  const queryClient = useQueryClient()

  const collectionId = collection === "mylib" ? mylibCol : wishlistCol
  const queryKey = ["gameStatus", collection, gameId]

  // Check if game exists in collection
  const { data: gameData } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await database.listDocuments(databaseId, collectionId, [
        Query.equal("user_id", userID),
        Query.equal("game_id", gameId),
      ])
      return {
        exists: result.documents.length > 0,
        documentId: result.documents[0]?.$id || "",
      }
    },
    enabled: !!gameId && !!userID,
  })

  const gamePresent = gameData?.exists ?? false
  const documentId = gameData?.documentId ?? ""

  // Add to collection mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      await database.createDocument(databaseId, collectionId, ID.unique(), {
        user_id: userID,
        game_id: gameId,
        game_name: gameName,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setGameAdded(true)
      const message =
        collection === "mylib" ? "Added to Library!" : "Added to Wishlist!"
      toast.success(message)
    },
    onError: (error) => {
      console.log(error)
      toast.error("Failed to add game")
    },
  })

  // Remove from collection mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      await database.deleteDocument(databaseId, collectionId, documentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setGameAdded(false)
      const message =
        collection === "mylib"
          ? "Removed from Library!"
          : "Removed from Wishlist!"
      toast.success(message)
    },
    onError: (error) => {
      console.log(error)
      toast.error("Failed to remove game")
    },
  })

  const addToCollection = () => addMutation.mutate()
  const removeFromCollection = () => removeMutation.mutate()

  const isLoading = addMutation.isPending || removeMutation.isPending

  return (
    <div>
      {collection === "mylib" ? (
        gamePresent ? (
          <MinusCircleIcon
            className="h-6 w-6 text-red-500 cursor-pointer
            hover:scale-110 transition-transform duration-300 ease-in-out"
            onClick={removeFromCollection}
            aria-disabled={isLoading}
          />
        ) : (
          <div className="flex space-x-2 font-semibold justify-between">
            <PlusCircleIcon
              className="h-6 w-6 text-green-500 cursor-pointer
              hover:scale-110
              transition-transform duration-300 ease-in-out"
              onClick={addToCollection}
              aria-disabled={isLoading}
            />
          </div>
        )
      ) : collection === "wishlist" ? (
        gamePresent ? (
          <HeartIcon
            className="h-6 w-6 text-red-500  cursor-pointer
            hover:scale-110 transition-transform duration-300 ease-in-out"
            onClick={removeFromCollection}
            aria-disabled={isLoading}
          />
        ) : (
          <div
            className="flex space-x-2 font-semibold justify-between
          hover:text-red-500 transition-colors duration-300 ease-in-out"
            aria-label="Add to Wishlist"
          >
            <HeartIcon
              className="h-6 w-6 cursor-pointer hover:scale-110
              transition-transform duration-300 ease-in-out"
              onClick={addToCollection}
              aria-disabled={isLoading}
            />
          </div>
        )
      ) : null}
    </div>
  )
}

export default AddButton
