import Discord from "@auth/core/providers/discord"
import Google from "@auth/core/providers/google"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { z } from "zod"
import type { DataModel } from "./_generated/dataModel"

const ParamsSchema = z.object({
  email: z.email(),
})

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const { error, data } = ParamsSchema.safeParse(params)
        if (error) {
          throw new ConvexError("Invalid email address.")
        }
        return {
          email: data.email,
          name: (params.name as string) || data.email.split("@")[0],
        }
      },
    }),
    // OAuth sign-in requires AUTH_DISCORD_ID/AUTH_DISCORD_SECRET and
    // AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET set on the Convex deployment.
    Discord,
    Google,
  ],
})
