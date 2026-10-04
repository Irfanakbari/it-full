FROM node:22-alpine AS builder
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY vendor vendor
RUN pnpm install --filter @itam/api... --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter @itam/api exec prisma generate \
    && pnpm --filter @itam/api build \
    && pnpm --filter @itam/api deploy --prod --legacy /prod/api

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /workspace/apps/api/dist ./dist
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /workspace/apps/api/package.json ./package.json
EXPOSE 7600
CMD ["node", "dist/src/main.js"]
