"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { convexClient } from "@/lib/convex-client";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexAuthNextjsProvider client={convexClient}>{children}</ConvexAuthNextjsProvider>;
}
