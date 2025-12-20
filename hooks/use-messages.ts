import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"
import { api } from "@/convex/_generated/api"

export type ChatMessage = FunctionReturnType<typeof api.messages.list>[number]

export function useMessages() {
  const messages = useQuery(api.messages.list)
  return {
    messages: messages ?? [],
    isLoading: messages === undefined,
  }
}
