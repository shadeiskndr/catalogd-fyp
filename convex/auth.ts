import Discord from "@auth/core/providers/discord";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";

const ParamsSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const { error, data } = ParamsSchema.safeParse(params);
        if (error) {
          throw new ConvexError("Invalid email address.");
        }
        return {
          email: data.email,
          name: data.name ?? data.email.split("@")[0] ?? data.email,
        };
      },
    }),
    Discord,
    Google,
  ],
});
