# syntax=docker/dockerfile:1

FROM node:22-bookworm AS dependencies

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@10.26.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY vendor vendor
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY apps apps

WORKDIR /workspace/apps/api
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm exec prisma generate && pnpm run build

WORKDIR /workspace/apps/web
RUN pnpm exec next build --webpack

WORKDIR /workspace
RUN mkdir -p /api-runtime/apps/api /api-runtime/vendor \
    && cp package.json pnpm-lock.yaml pnpm-workspace.yaml /api-runtime/ \
    && cp apps/api/package.json /api-runtime/apps/api/package.json \
    && cp vendor/* /api-runtime/vendor/ \
    && cd /api-runtime \
    && pnpm install --prod --frozen-lockfile --filter @itam/api...

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends dumb-init openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /api-runtime/node_modules ./node_modules
COPY --from=build --chown=node:node /api-runtime/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /workspace/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /workspace/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=build --chown=node:node /workspace/apps/web/.next/standalone ./web-runtime
COPY --from=build --chown=node:node /workspace/apps/web/.next/static ./web-runtime/apps/web/.next/static
COPY --from=build --chown=node:node /workspace/apps/web/public ./web-runtime/apps/web/public
COPY --chown=node:node start.sh ./start.sh

RUN chmod +x ./start.sh

USER node

EXPOSE 7600
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const role=process.env.SERVICE_ROLE||'api';const port=process.env.PORT||(role==='web'?'3000':'7600');const path=role==='web'?'/it-asset/api/health':'/v1/health';fetch('http://127.0.0.1:'+port+path).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["dumb-init", "--", "./start.sh"]
CMD ["api"]
