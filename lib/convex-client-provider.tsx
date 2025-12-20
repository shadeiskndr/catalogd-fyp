"use client"

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs"
import { ConvexReactClient } from "convex/react"

// Shared client instance, also used outside React (see lib/rawg-client.ts).
export const convexClient = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
)

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexAuthNextjsProvider client={convexClient}>
      {children}
    </ConvexAuthNextjsProvider>
  )
}
