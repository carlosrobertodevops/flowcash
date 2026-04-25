# Agent Instructions

## Package Manager

- Use **Bun**: `bun install`, `bun run dev`, `bun test`, `bun run build`.
- Do not switch package managers or regenerate lockfiles unless asked.

## Project Context

- FlowCash: Next.js App Router app for payables and receivables.
- Product docs: `docs/PRD.md`, `docs/SDD.md`, `docs/SPEC.md`.
- UI source: `docs/UI-PARTNER.md`.
- Code graph: read `graphify-out/GRAPH_REPORT.md` before architecture/codebase answers; use `graphify-out/graph.json` only if needed.

## Session Defaults

- Start with `caveman wenyan-ultra`.
- Use `context-mode` for large outputs, tests, builds, diffs, logs, API calls, and data processing.
- Run `graphify update .` only after the project/work is ready for final sync.

## Stack And Key Files

- Stack: Bun, Next.js, TypeScript, React, Tailwind CSS, Drizzle ORM, Postgres, Recharts, Zod.
- Server actions: `src/app/actions.ts`.
- Zod schemas: `src/lib/validators.ts`.
- Drizzle schema: `src/db/schema.ts`.

## Commands

| Task            | Command                         |
| --------------- | ------------------------------- |
| Dev             | `bun run dev`                   |
| Build/typecheck | `bun run build`                 |
| All tests       | `bun test`                      |
| One test        | `bun test path/to/file.test.ts` |
| DB push         | `bun run db:push`               |
| Seed            | `bun run db:seed`               |
| Docker          | `docker compose up --build`     |

## Domain Rules

- Accounts use soft delete: set `deleted = true` and `deletedAt`; never physical-delete user accounts.
- Hide deleted accounts from user flows.
- Status pairs: `payable` -> `pending|paid`; `receivable` -> `pending|received`.
- Monthly/yearly recurrence creates 6 future accounts.
- Access must respect `tenantId`, role, owner, and `collaboratorEmails`.
- Empty account category normalizes to `Geral`; BRL/USD uses `EXCHANGE_RATE_BRL_USD`.
- Session uses HTTP-only signed cookie; passwords use bcrypt hash only.

## Validation And Data

- Validate new user input with shared Zod schemas before database writes.
- Keep money in `numeric(12, 2)`; convert to number only for display/simple dashboard calculations.
- CSV import header: `title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails`.
- Seed admin: `admin@flowclash.com` / `@flowcash123`.

## UI And Docs

- Reuse `src/components/ui/*` primitives before adding new components.
- Follow `docs/UI-PARTNER.md` for colors, typography, cards, dialogs, forms, charts, and animations.
- Update docs when behavior, schema, commands, or UI patterns change.
- Keep graphify updates for the ready/final sync step, not every small edit.

## Safety

- Preserve unrelated local changes; never revert user changes without explicit request.
- Do not commit unless the user explicitly asks.

## Commit Attribution

AI commits MUST include: `Co-Authored-By: (the agent model's name and attribution byline)`.
