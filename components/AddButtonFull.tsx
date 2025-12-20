"use client"
import {
  HeartIcon as HeartIconOutline,
  PlusCircleIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon, MinusCircleIcon } from "@heroicons/react/24/solid"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"

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
  const list = collection === "mylib" ? "library" : "wishlist"
  const [isPending, setIsPending] = useState(false)

  const gamePresent = useQuery(api.gameLists.status, { list, gameId }) ?? false

  const addToList = useMutation(api.gameLists.add)
  const removeFromList = useMutation(api.gameLists.remove)

  const addToCollection = async () => {
    setIsPending(true)
    try {
      await addToList({ list, gameId, gameName })
      const message =
        collection === "mylib" ? "Added to Library!" : "Added to Wishlist!"
      toast.success(message)
    } catch (error) {
      console.log(error)
      toast.error("Failed to add game")
    } finally {
      setIsPending(false)
    }
  }

  const removeFromCollection = async () => {
    setIsPending(true)
    try {
      await removeFromList({ list, gameId })
      const message =
        collection === "mylib"
          ? "Removed from Library!"
          : "Removed from Wishlist!"
      toast.success(message)
    } catch (error) {
      console.log(error)
      toast.error("Failed to remove game")
    } finally {
      setIsPending(false)
    }
  }

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
      disabled={isPending}
    >
      {config.icon}
      {isPending ? "Loading..." : config.label}
    </Button>
  )
}

export default AddButtonFull
