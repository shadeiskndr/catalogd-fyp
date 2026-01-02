import { HOUR, MINUTE, RateLimiter, type RunMutationCtx } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiRecGlobal: { kind: "token bucket", rate: 300, period: HOUR, capacity: 60 },
  aiRecPerUser: { kind: "token bucket", rate: 40, period: HOUR, capacity: 12 },
  ragSearchGlobal: { kind: "token bucket", rate: 600, period: HOUR, capacity: 120 },
  ragSearchPerUser: { kind: "token bucket", rate: 90, period: HOUR, capacity: 20 },
  attachmentPerUser: { kind: "token bucket", rate: 30, period: HOUR, capacity: 8 },
});

export type RateLimitError = { code: "rate_limited"; scope: string; retryAfterSeconds: number };

function retrySeconds(retryAfter: number | undefined): number {
  return Math.max(1, Math.ceil((retryAfter ?? MINUTE) / 1000));
}

function rateLimited(scope: string, retryAfter: number | undefined): ConvexError<RateLimitError> {
  return new ConvexError<RateLimitError>({
    code: "rate_limited",
    scope,
    retryAfterSeconds: retrySeconds(retryAfter),
  });
}

export async function enforceAiRecLimits(ctx: RunMutationCtx, userId: string): Promise<void> {
  const perUser = await rateLimiter.limit(ctx, "aiRecPerUser", { key: userId });
  if (!perUser.ok) {
    throw rateLimited("user", perUser.retryAfter);
  }
  const global = await rateLimiter.limit(ctx, "aiRecGlobal");
  if (!global.ok) {
    throw rateLimited("global", global.retryAfter);
  }
}

export async function enforceSearchLimits(ctx: RunMutationCtx, userId: string): Promise<void> {
  const perUser = await rateLimiter.limit(ctx, "ragSearchPerUser", { key: userId });
  if (!perUser.ok) {
    throw rateLimited("user", perUser.retryAfter);
  }
  const global = await rateLimiter.limit(ctx, "ragSearchGlobal");
  if (!global.ok) {
    throw rateLimited("global", global.retryAfter);
  }
}

export async function enforceAttachmentLimits(ctx: RunMutationCtx, userId: string): Promise<void> {
  const perUser = await rateLimiter.limit(ctx, "attachmentPerUser", { key: userId });
  if (!perUser.ok) {
    throw rateLimited("user", perUser.retryAfter);
  }
}
