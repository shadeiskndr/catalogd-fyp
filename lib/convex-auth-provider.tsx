import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { connection } from "next/server";
import type { ReactNode } from "react";

export async function ConvexAuthProvider({ children }: { children: ReactNode }) {
  await connection();

  return <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>;
}
