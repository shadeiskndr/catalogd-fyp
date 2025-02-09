"use client"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { HeartIcon, MinusCircleIcon } from "@heroicons/react/24/solid"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ID, Query } from "appwrite"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={removeFromCollection}
                disabled={isLoading}
                className="text-red-500 hover:text-red-600"
              >
                <MinusCircleIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove from Library</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={addToCollection}
                disabled={isLoading}
                className="text-green-500 hover:text-green-600"
              >
                <PlusCircleIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to Library</TooltipContent>
          </Tooltip>
        )
      ) : collection === "wishlist" ? (
        gamePresent ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={removeFromCollection}
                disabled={isLoading}
                className="text-red-500 hover:text-red-600"
              >
                <HeartIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove from Wishlist</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={addToCollection}
                disabled={isLoading}
                className="text-gray-400 hover:text-red-500"
                aria-label="Add to Wishlist"
              >
                <HeartIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add to Wishlist</TooltipContent>
          </Tooltip>
        )
      ) : null}
    </div>
  )
}

export default AddButton
