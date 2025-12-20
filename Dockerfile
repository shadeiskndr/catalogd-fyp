### 1. Install deps (cached unless package.json/bun.lock change) ###
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
# Re-install sharp so its native binary gets built (needed by next/image).
RUN bun install sharp

### 2. Build: push Convex functions, then `next build` ###
FROM oven/bun:1 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Non-secret build-time vars (safe as ARG).
ARG CONVEX_SELF_HOSTED_URL
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL
ENV CONVEX_SELF_HOSTED_URL=$CONVEX_SELF_HOSTED_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_SITE_URL=$NEXT_PUBLIC_CONVEX_SITE_URL

# Admin key is a secret — never bake it into image layers.
# Pass at build time with: docker build --secret id=convex_admin_key,env=CONVEX_SELF_HOSTED_ADMIN_KEY ...
RUN --mount=type=secret,id=convex_admin_key \
    CONVEX_SELF_HOSTED_ADMIN_KEY=$(cat /run/secrets/convex_admin_key) \
    bunx convex deploy --cmd 'bun run build'

### 3. Runner: minimal image, just the standalone server ###
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static
COPY --from=builder --chown=bun:bun /app/public ./public

USER bun
EXPOSE 3000
CMD ["bun", "server.js"]
