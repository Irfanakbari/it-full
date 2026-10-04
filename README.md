# IT Asset Management System

Production-oriented IT asset registry built as a pnpm monorepo.

## Applications

- `apps/web`: Next.js BFF and Ant Design user interface.
- `apps/api`: NestJS API, Vuteq SSO resource server, Prisma/PostgreSQL.

## Local setup

1. Copy `.env.example` to `.env` for Docker Compose.
2. For local processes, copy `apps/api/.env.example` to `apps/api/.env`
   and `apps/web/.env.example` to `apps/web/.env`, then set the same registered
   Vuteq SSO client secret in both server applications.
3. Run `pnpm install`.
4. Start PostgreSQL and Redis with `docker compose up -d postgres redis`.
5. Run `pnpm prisma:migrate:deploy && pnpm prisma:seed`.
6. Run `pnpm dev:api` and `pnpm dev:web`.

Environment variable names follow the ANSEI convention: `PORT` for the API,
`API_URL` for the server-side web-to-API address, and split Redis settings via
`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `VUTEQ_SSO_REDIS_DB`, and
`VUTEQ_SSO_REDIS_KEY_PREFIX`. Browser code never reads these variables.

Employee and department data remain owned by ESSA/HRIS. Configure the API-only
`ESSA_API_URL`, `ESSA_API_KEY`, and optional `ESSA_API_TIMEOUT_MS` variables.
The ESSA API key needs `MASTER_EMPLOYEE_READ`. ITAM exposes only a paginated,
sanitized employee lookup sourced only from ESSA's `/v1/employee-management/option`
endpoint and stores the selected employee number and name as an assignment-history
snapshot; it does not maintain a second employee or department master.

The Vuteq SSO client must register `/auth/callback`, the application origin,
and `/api/auth/backchannel-logout` exactly. OAuth tokens stay in the server-side
Redis session and are never returned to the browser.
