"use client"

import { TrashIcon } from "@heroicons/react/24/solid"
import { useQueryClient } from "@tanstack/react-query"
import { ID } from "appwrite"
import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { BeatLoader } from "react-spinners"
import { Button } from "@/components/ui/button"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/conversation"
import { Message, MessageContent } from "@/components/ui/shadcn-io/message"
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ui/shadcn-io/prompt-input"
import { type ChatMessage, useMessages } from "@/hooks/use-messages"
import { useSession } from "@/hooks/use-session"
import { database, databaseId, messagesCol } from "@/utils/appwrite"

const ChatRoom = () => {
  const [newMessage, setNewMessage] = useState<string>("")
  const queryClient = useQueryClient()

  const { data: session } = useSession()
  const { data: messages = [], isLoading, refetch } = useMessages()

  const currentUserId = session?.$id ?? ""
  const userName = session?.name ?? ""

  // Handle visibility changes to control polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling
        queryClient.setQueryData(
          ["messages", "list"],
          queryClient.getQueryData(["messages", "list"]),
        )
      } else {
        // Resume polling
        refetch()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [queryClient, refetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error("Message cannot be empty.")
      return
    }

    try {
      const messageData = {
        user_id: currentUserId,
        user_name: userName,
        message: newMessage,
      }

      const response = await database.createDocument(
        databaseId,
        messagesCol,
        ID.unique(),
        messageData,
      )

      // Optimistically update cache
      queryClient.setQueryData(
        ["messages", "list"],
        (old: ChatMessage[] = []) => [
          ...old,
          { ...messageData, id: response.$id, created_at: response.$createdAt },
        ],
      )

      setNewMessage("")
      toast.success("Message sent successfully!")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Error sending message.")
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      await database.deleteDocument(databaseId, messagesCol, messageId)

      // Optimistically update cache
      queryClient.setQueryData(
        ["messages", "list"],
        (old: ChatMessage[] = []) =>
          old.filter((message) => message.id !== messageId),
      )

      toast.success("Message deleted successfully!")
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Error deleting message.")
    }
  }

  return (
    <div className="space-y-4 pt-4 px-2">
      <h1 className="text-3xl font-bold">Chat Room</h1>
      <div className="w-full rounded-lg shadow-lg mx-auto max-w-5xl border flex flex-col h-230">
        <Conversation className="flex-1">
          <ConversationContent>
            {isLoading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <BeatLoader />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  from={
                    message.user_id === currentUserId ? "user" : "assistant"
                  }
                  className="group"
                >
                  <div className="flex flex-col gap-1">
                    <MessageContent>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1">
                            {message.user_name}
                          </p>
                          <p className="wrap-break-word">{message.message}</p>
                        </div>
                        {message.user_id === currentUserId && (
                          <Button
                            onClick={() => handleDelete(message.id)}
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                    </MessageContent>
                    <p className="text-xs px-4">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t p-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write your message..."
              maxLength={300}
            />
            <PromptInputToolbar>
              <div></div>
              <PromptInputSubmit title="Send Message" />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

export default ChatRoom
