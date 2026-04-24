# FlowCash

App pessoal para controle de contas a pagar e a receber.

## Stack

- Bun
- Next.js
- Drizzle ORM
- Postgres
- Tailwind CSS
- UI no estilo ShadCN
- Recharts

## Setup Local

```bash
bun install
cp .env.example .env
bun run db:push
bun run db:seed
bun run dev
```

Abra `http://localhost:3000`.

Usuario seed:

- Email: `admin@flowclash.com`
- Senha: `@flowcash123`

## Docker

```bash
docker compose up --build
```

O container da aplicacao aplica o schema e roda o seed antes de iniciar o Next.js.

## Comandos

```bash
bun run dev
bun run build
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:seed
```

## Regra de Exclusao

Contas nunca devem ser removidas fisicamente pelo fluxo do usuario. Ao apagar uma conta, o app marca:

- `deleted = true`
- `deletedAt = now()`

Registros apagados deixam de aparecer no dashboard.
