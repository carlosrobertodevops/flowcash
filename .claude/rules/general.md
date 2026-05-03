# Regras Gerais

## Stack

- Bun como runtime, package manager e executor.
- Next.js com App Router para UI.
- Elysia para API HTTP.
- Drizzle ORM com PostgreSQL.
- Zod 4 para validacao.
- Docker Compose com `app` e `db`.
- Tailwind CSS e ShadCN/UI na interface.

## Comandos

```bash
bun install
bun run dev
docker compose up --build
bunx drizzle-kit generate
bunx drizzle-kit migrate
bunx drizzle-kit studio
```

## Estrutura Esperada

- `app/` ou `src/app/` para rotas, layouts e paginas Next.js.
- `components/ui/` para componentes ShadCN.
- `src/server/` para API Elysia.
- `src/db/` para client, schema e queries Drizzle.
- `drizzle/` para migrations geradas.
- `docker-compose.yml` para ambiente app + banco.

## MCPs

- Use Context7 para documentacao atual de bibliotecas, frameworks, SDKs, APIs e CLIs.
