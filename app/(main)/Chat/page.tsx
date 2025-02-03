"use client" // Add this line at the top

import React, { useState, useEffect } from "react"
import {
  database,
  databaseId,
  messagesCol,
  getSessionData,
  userID,
} from "@/utils/appwrite"
import { TrashIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid"
import { ID, Query } from "appwrite"
import { toast } from "react-hot-toast"
import { BeatLoader } from "react-spinners"

interface Message {
  id: string
  user_id: string
  user_name: string
  message: string
  created_at: string
}

const ChatRoom = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const sessionData = await getSessionData()
        if (sessionData && sessionData.name) {
          setUserName(sessionData.name)
          setCurrentUserId(sessionData.$id) // Set the current user ID
        }
      } catch (error) {
        console.error("Error fetching user name:", error)
      }
    }

    fetchUserName()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await database.listDocuments(databaseId, messagesCol, [
        Query.orderDesc("$createdAt"),
      ])
      const fetchedMessages = response.documents.map((doc: any) => ({
        id: doc.$id,
        user_id: doc.user_id,
        user_name: doc.user_name,
        message: doc.message,
        created_at: doc.$createdAt,
      }))
      setMessages(fetchedMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    const intervalId = setInterval(fetchMessages, 15000) // Fetch messages every 15 seconds

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId)
      } else {
        fetchMessages()
        setInterval(fetchMessages, 15000) // Resume fetching messages every 15 seconds
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error("Message cannot be empty.")
      return
    }

    try {
      const messageData = {
        user_id: userID,
        user_name: userName,
        message: newMessage,
      }

      const response = await database.createDocument(
        databaseId,
        messagesCol,
        ID.unique(),
        messageData,
      )

      setMessages([
        { ...messageData, id: response.$id, created_at: response.$createdAt },
        ...messages,
      ])
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
      setMessages(messages.filter((message) => message.id !== messageId))
      toast.success("Message deleted successfully!")
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Error deleting message.")
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-gray-300 text-3xl font-bold">Chat Room</h1>
      <div className="w-full bg-gray-800 p-6 rounded-lg shadow-lg mx-auto mt-10 max-w-screen-lg">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">
          Real-time Public Chat Room
        </h1>
        <div className="flex flex-col-reverse space-y-4 mb-4 h-[45rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {/*loading component*/}
          {loading && (
            <div className="flex justify-center items-center">
              <BeatLoader color="#ffa600" size={10} loading={true} />
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-transparent p-4 rounded-md flex justify-between items-center ${
                message.user_id == currentUserId ? "ml-auto" : "mr-auto"
              }`}
            >
              {/*trash button*/}
              {message.user_id === currentUserId && (
                <button
                  onClick={() => handleDelete(message.id)}
                  className="text-red-500 hover:text-red-700 mr-2"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}

              {/*message div name, body, date*/}
              <div
                className={`${message.user_id == currentUserId ? "text-right" : ""}`}
              >
                <h2 className="text-lg font-semibold text-white">
                  {message.user_name}
                </h2>
                <div
                  className={`p-2 rounded-lg max-w-md ${message.user_id === userID ? "bg-red-900 text-white" : "bg-purple-900 text-white"}`}
                >
                  <p className="text-gray-300 text-left">{message.message}</p>
                </div>
                <p className="text-gray-500 text-sm">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-700 p-4 rounded-md flex items-center space-x-4"
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your message..."
            className="w-full p-2 bg-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
            rows={1}
            maxLength={300} // Limit to 350 characters
          />
          <button
            type="submit"
            title="Send Message"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 ease-in-out flex items-center justify-center"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatRoom
