# CLAUDE.md - FlowCash

## Project Codex behavior

Default Caveman mode: wenyan-ultra.

Use wenyan-ultra for all prose responses.
Keep commands, code, configs, filenames, paths, and API names exact.
Never compress code blocks.

## Visao Geral

FlowCash e um app web de controle financeiro pessoal para gerenciar contas a pagar e a receber.

O produto inclui autenticacao, dashboard financeiro, CRUD com soft delete, recorrencia, categorias/tags, importacao/exportacao CSV, impressao/PDF, recuperacao de senha por token local, cotacao BRL/USD configuravel e compartilhamento simples por email.

## Como Trabalhar Neste Projeto

- Leia `PRD.md`, `SDD.md`, `SPEC.MD` e `AGENTS.md` quando precisar de contexto de produto ou arquitetura.
- Prefira mudancas pequenas, tipadas e alinhadas ao padrao existente.
- Nao apague registros de contas fisicamente no fluxo de usuario.
- Preserve alteracoes locais que nao sejam suas.
- Atualize documentacao quando mudar comportamento, schema ou comandos.

## Stack

- Bun
- Next.js com App Router
- TypeScript
- React
- Tailwind CSS
- Componentes no padrao ShadCN/UI
- Drizzle ORM
- Postgres
- Recharts
- Zod
- Docker Compose

## Estrutura

```text
src/app
src/components
src/components/ui
src/db
src/lib
src/scripts
```

Responsabilidades:

- `src/app`: rotas, layouts e server actions.
- `src/components`: UI de produto.
- `src/components/ui`: primitivos reutilizaveis.
- `src/db`: schema e conexao.
- `src/lib`: auth, validacao e utilitarios.
- `src/scripts`: seed.

## Regras de Dominio

- Contas usam soft delete: `deleted = true` e `deletedAt`.
- Contas apagadas nao aparecem para o usuario.
- `payable` aceita `pending` ou `paid`.
- `receivable` aceita `pending` ou `received`.
- Recorrencia mensal/anual gera 6 contas futuras no cadastro.
- Colaboradores sao emails em `collaboratorEmails`.
- Dono ou colaborador pode visualizar/editar conta compartilhada.
- Cotacao BRL/USD usa `EXCHANGE_RATE_BRL_USD`.
- Recuperacao de senha usa token local com hash e expiracao.

## Autenticacao

Seed admin:

- Email: `admin@flowclash.com`
- Senha: `@flowcash123`

O app usa cookie HTTP-only com token assinado. Senhas devem usar hash bcrypt.

## CSV

Formato de importacao:

```text
title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails
```

Exportacao CSV deve respeitar contas atualmente filtradas.

PDF e gerado pelo fluxo de impressao do navegador.

## Variaveis de Ambiente

```bash
DATABASE_URL=postgres://flowcash:flowcash@localhost:5432/flowcash
AUTH_SECRET=change-me-with-a-long-random-secret
EXCHANGE_RATE_BRL_USD=5.15
```

## Comandos

```bash
bun install
bun run dev
bun run build
bun run db:push
bun run db:seed
```

Depois de alterar schema:

```bash
bun run db:push
```

Depois de alterar implementacao:

```bash
bun run build
```

## Docker

```bash
docker compose up --build
```

O compose sobe Postgres e app. O app aplica schema e seed antes de iniciar.

## UI

Direcao visual:

- Dark/light mode.
- Glassmorphism em cards e dialogos.
- Fundo com linhas finas.
- Azul brilhante como destaque.
- Hover com bordas iluminadas.
- Transicoes suaves.
- Tela de login dividida em desktop.

## Checklist Antes de Finalizar

- Build passa com `bun run build`.
- Schema novo esta refletido em Drizzle.
- Entradas novas tem validacao Zod.
- Fluxos autenticados checam usuario/colaborador.
- Documentacao foi atualizada se necessario.
- Nao houve reversao de alteracoes locais nao relacionadas.
