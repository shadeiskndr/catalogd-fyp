"use client"

import { TrashIcon } from "@heroicons/react/24/solid"
import { useMutation } from "convex/react"
import { ConvexError } from "convex/values"
import type React from "react"
import { useState } from "react"
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
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useMessages } from "@/hooks/use-messages"

const ChatRoom = () => {
  const [newMessage, setNewMessage] = useState<string>("")

  const { user } = useCurrentUser()
  const { messages, isLoading } = useMessages()

  const sendMessage = useMutation(api.messages.send)
  const removeMessage = useMutation(api.messages.remove)

  const currentUserId = user?._id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error("Message cannot be empty.")
      return
    }

    try {
      await sendMessage({ body: newMessage })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      if (error instanceof ConvexError && typeof error.data === "string") {
        toast.error(error.data)
      } else {
        toast.error("Error sending message.")
      }
    }
  }

  const handleDelete = async (messageId: Id<"messages">) => {
    try {
      await removeMessage({ id: messageId })
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
            {isLoading ? (
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
                  from={message.userId === currentUserId ? "user" : "assistant"}
                  className="group"
                >
                  <div className="flex flex-col gap-1">
                    <MessageContent>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1">
                            {message.userName}
                          </p>
                          <p className="wrap-break-word">{message.message}</p>
                        </div>
                        {message.userId === currentUserId && (
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
                      {new Date(message.createdAt).toLocaleString()}
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
