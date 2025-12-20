"use client"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import { HeartIcon, MinusCircleIcon } from "@heroicons/react/24/solid"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"

type AddButtonProps = {
  collection: string
  gameId: number
  gameName: string
}

const AddButton = ({ collection, gameId, gameName }: AddButtonProps) => {
  const list = collection === "mylib" ? "library" : "wishlist"
  const [isPending, setIsPending] = useState(false)

  const gamePresent = useQuery(api.gameLists.status, { list, gameId }) ?? false

  const addToList = useMutation(api.gameLists.add)
  const removeFromList = useMutation(api.gameLists.remove)

  const addToCollection = async (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const removeFromCollection = async (e: React.MouseEvent) => {
    e.stopPropagation()
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
                disabled={isPending}
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
