## Git

- **SEMPRE** use Conventional Commits. Exemplo: `feat: add workout session endpoint`, `fix: workout validation`, `docs: update stack rules`.
- **NUNCA** faca commit sem permissao explicita do usuario.

## Next.js UI

- Use App Router.
- usar o figma-mcp com componentes ShdCN/UI em `src/components/ui` e estilize com Tailwind, em com os likils do layouts do figma:
  - Login: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-1276&m=dev`
  - AI: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-1053&m=dev`
  - AI Onbording: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-1053&m=dev`
  - AI Coach: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-936&m=dev`
  - Plano de Treino: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-808&m=dev`
  - Home: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-679&m=dev`
  - Perfil: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-608&m=dev`
  - Eveolução: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-410&m=dev`
  - Evolução: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-212&m=dev`
  - Plano de Treino: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-79&m=dev`
  - Home: `https://www.figma.com/design/ljuq4iRj8Oa3OU9g47e1Ht/FIT.AI--Alunos---Estudos?node-id=3606-2&m=dev`
- Server Components por padrao; use `"use client"` apenas quando houver estado, efeitos, eventos ou APIs do browser.
- Use ShadCN/UI para componentes de base e Tailwind CSS para layout.
- Componentes ShadCN devem usar composicao completa (`CardHeader`, `CardContent`, `DialogTitle`, etc.).
- Prefira tokens semanticos (`bg-background`, `text-muted-foreground`, `bg-primary`) a cores hardcoded.

## Elysia API

- Crie rotas REST com Elysia em `src/server/`.
- Handlers validam entrada, chamam camada de negocio e retornam HTTP status correto.
- Nao coloque regra de negocio complexa diretamente no handler.
- Use Zod 4 para validar body, params, query e responses quando aplicavel.
- Rotas protegidas devem centralizar autenticacao em middleware/plugin.

## Drizzle ORM

- Schema do banco deve ficar em `src/db/schema.ts` ou arquivos dentro de `src/db/schema/`.
- Client Drizzle deve ficar em `src/db/client.ts` ou `src/db/index.ts`.
- Migrations devem ser geradas por `bunx drizzle-kit generate` e aplicadas por `bunx drizzle-kit migrate`.
- Nao retorne linhas do banco diretamente pela API quando houver campos sensiveis ou formato publico diferente; mapeie para DTO.
- Use transacoes Drizzle quando uma regra alterar multiplas tabelas de forma atomica.

## Docker

- `docker-compose.yml` deve conter `app` e `db`.
- `app` deve depender de `db` com healthcheck.
- `db` deve usar volume persistente.
- Variaveis devem vir de `.env`; secrets reais nao devem ser commitados.
