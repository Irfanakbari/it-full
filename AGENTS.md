# IT Asset Management Monorepo

This repository is a pnpm workspace with `apps/web` (Next.js 16, React 19,
Ant Design 6) and `apps/api` (NestJS 11, Prisma 7, PostgreSQL).

## Contracts

- Browser business requests must go through the Next.js BFF proxy. Never expose
  bearer tokens or the internal API URL to client code.
- Prisma models, fields, relations, and enums use PascalCase. Generated Prisma
  files are disposable and must not be hand-edited.
- Every list endpoint is paginated and every table filter/search/sort is server-side.
- Every mutation must create process and immutable action-audit evidence.
- Use soft deletion for primary/master data; audit/history records are immutable.
- Preserve the ANSEI-derived visual system, toolbar order, GoldenArrowAction,
  and Ant Design table-header filter convention.

## Commands

Use root scripts and pnpm filters. Do not run destructive database reset or seed
commands against an unknown database.
