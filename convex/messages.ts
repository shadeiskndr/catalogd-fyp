import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

const MAX_MESSAGE_LENGTH = 300
const MESSAGE_LIMIT = 100

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .order("desc")
      .take(MESSAGE_LIMIT)
    messages.reverse()
    const names = new Map<string, string>()
    const result = []
    for (const message of messages) {
      let userName = names.get(message.userId)
      if (userName === undefined) {
        const user = await ctx.db.get(message.userId)
        userName = user?.name ?? "Unknown"
        names.set(message.userId, userName)
      }
      result.push({
        id: message._id,
        userId: message.userId,
        userName,
        message: message.body,
        createdAt: message._creationTime,
      })
    }
    return result
  },
})

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new ConvexError("Not authenticated")
    }
    const body = args.body.trim()
    if (body.length === 0) {
      throw new ConvexError("Message cannot be empty.")
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError(
        `Message cannot be longer than ${MAX_MESSAGE_LENGTH} characters.`,
      )
    }
    await ctx.db.insert("messages", { userId, body })
  },
})

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (userId === null) {
      throw new ConvexError("Not authenticated")
    }
    const message = await ctx.db.get(args.id)
    if (message === null) {
      return
    }
    if (message.userId !== userId) {
      throw new ConvexError("You can only delete your own messages.")
    }
    await ctx.db.delete(args.id)
  },
})
