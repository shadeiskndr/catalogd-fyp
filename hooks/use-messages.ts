import type { UseQueryResult } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
import { Query } from "appwrite"
import { database, databaseId, messagesCol } from "@/utils/appwrite"

export interface ChatMessage {
  id: string
  user_id: string
  user_name: string
  message: string
  created_at: string
}

export const messageKeys = {
  all: ["messages"] as const,
  list: () => [...messageKeys.all, "list"] as const,
}

export function useMessages(): UseQueryResult<ChatMessage[], Error> {
  return useQuery<ChatMessage[]>({
    queryKey: messageKeys.list(),
    queryFn: async (): Promise<ChatMessage[]> => {
      const response = await database.listDocuments(databaseId, messagesCol, [
        Query.orderDesc("$createdAt"),
      ])

      const messages = response.documents.map((doc: Record<string, unknown>) => ({
        id: doc.$id,
        user_id: doc.user_id,
        user_name: doc.user_name,
        message: doc.message,
        created_at: doc.$createdAt,
      })) as ChatMessage[]

      return messages.reverse()
    },
    refetchInterval: 15000, // Poll every 15 seconds
  })
}
