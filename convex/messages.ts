import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_MESSAGE_LENGTH = 300;
const MESSAGE_LIMIT = 100;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(MESSAGE_LIMIT);
    messages.reverse();
    const userIds = Array.from(new Set(messages.map((message) => message.userId)));
    const users = await Promise.all(userIds.map((userId) => ctx.db.get("users", userId)));
    const names = new Map(
      userIds.map((userId, index) => [userId, users[index]?.name ?? "Unknown"])
    );
    return messages.map((message) => ({
      id: message._id,
      userId: message.userId,
      userName: names.get(message.userId) ?? "Unknown",
      message: message.body,
      createdAt: message._creationTime,
    }));
  },
});

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const body = args.body.trim();
    if (body.length === 0) {
      throw new ConvexError("Message cannot be empty.");
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new ConvexError(`Message cannot be longer than ${MAX_MESSAGE_LENGTH} characters.`);
    }
    await ctx.db.insert("messages", { userId, body });
  },
});

export const remove = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }
    const message = await ctx.db.get("messages", args.id);
    if (message === null) {
      return;
    }
    if (message.userId !== userId) {
      throw new ConvexError("You can only delete your own messages.");
    }
    await ctx.db.delete("messages", args.id);
  },
});
