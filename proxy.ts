import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const isPublicPage = createRouteMatcher(["/"]);

const convexSiteUrl = process.env["NEXT_PUBLIC_CONVEX_SITE_URL"];

if (convexSiteUrl === undefined) {
  throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is not set");
}

const issuer = convexSiteUrl.replace(/\/$/, "");

const jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", issuer), {
  timeoutDuration: 3000,
});

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (token === undefined) {
    return false;
  }
  try {
    await jwtVerify(token, jwks, { issuer, audience: "convex" });
    return true;
  } catch {
    return false;
  }
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await hasValidSession(await convexAuth.getToken());
  if (isPublicPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
  if (!isPublicPage(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }
  return undefined;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
