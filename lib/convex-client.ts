import { ConvexReactClient } from "convex/react";

const convexUrl = process.env["NEXT_PUBLIC_CONVEX_URL"];

if (convexUrl === undefined) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

export const convexClient = new ConvexReactClient(convexUrl);
