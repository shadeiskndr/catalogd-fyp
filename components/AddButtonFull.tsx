"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ID, Query } from "appwrite"
import { toast } from "react-hot-toast"
import { PlusCircleIcon, HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline"
import { HeartIcon, MinusCircleIcon } from "@heroicons/react/24/solid"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/lib/stores/game-store"
import {
  database,
  databaseId,
  mylibCol,
  userID,
  wishlistCol,
} from "@/utils/appwrite"

type AddButtonFullProps = {
  collection: string
  gameId: number
  gameName: string
}

const AddButtonFull = ({
  collection,
  gameId,
  gameName,
}: AddButtonFullProps) => {
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

  const getButtonConfig = () => {
    if (collection === "mylib") {
      return gamePresent
        ? {
            label: "Remove from Library",
            variant: "destructive" as const,
            icon: <MinusCircleIcon className="size-4" />,
          }
        : {
            label: "Add to Library",
            variant: "default" as const,
            icon: <PlusCircleIcon className="size-4" />,
          }
    }
    return gamePresent
      ? {
          label: "Remove from Wishlist",
          variant: "destructive" as const,
          icon: <HeartIcon className="size-4" />,
        }
      : {
          label: "Add to Wishlist",
          variant: "default" as const,
          icon: <HeartIconOutline className="size-4" />,
        }
  }

  const config = getButtonConfig()

  return (
    <Button
      variant={config.variant}
      onClick={gamePresent ? removeFromCollection : addToCollection}
      disabled={isLoading}
    >
      {config.icon}
      {isLoading ? "Loading..." : config.label}
    </Button>
  )
}

export default AddButtonFull
