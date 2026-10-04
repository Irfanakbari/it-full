FROM node:22-alpine AS builder
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/package.json
COPY vendor vendor
RUN pnpm install --filter @itam/web... --frozen-lockfile
COPY apps/web apps/web
RUN pnpm --filter @itam/web build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /workspace/apps/web/.next/standalone ./
COPY --from=builder /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /workspace/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
