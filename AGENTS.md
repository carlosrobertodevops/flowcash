# AGENTS.md - FlowCash

# Project Codex behavior

Default Caveman mode: wenyan-ultra.

Use wenyan-ultra for all prose responses.
Keep commands, code, configs, filenames, paths, and API names exact.
Never compress code blocks.

## Visao Geral

FlowCash e um app web de controle financeiro pessoal para gerenciar contas a pagar e a receber.

O produto tem login/cadastro, dashboard financeiro, CRUD de contas, soft delete, recorrencia, categorias/tags, importacao/exportacao CSV, impressao/PDF, recuperacao de senha por token local, cotacao BRL/USD configuravel e compartilhamento simples por email de colaborador.

## Stack

- Runtime: Bun
- Framework: Next.js com App Router
- Linguagem: TypeScript
- UI: React, Tailwind CSS e componentes no padrao ShadCN/UI
- ORM: Drizzle ORM
- Banco: Postgres
- Graficos: Recharts
- Validacao: Zod
- Auth: cookie HTTP-only com JWT assinado
- Infra local: Docker Compose

## Estrutura do Projeto

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
- `src/components`: componentes da aplicacao.
- `src/components/ui`: componentes base reutilizaveis.
- `src/db`: schema Drizzle e conexao Postgres.
- `src/lib`: auth, validacao, formatacao e utilitarios.
- `src/scripts`: seed e scripts operacionais.

## Modelo de Dados

### Usuario

- `id`
- `name`
- `email`
- `passwordHash`
- `role`: `user` ou `admin`
- `createdAt`
- `updatedAt`

### Conta

- `id`
- `userId`
- `title`
- `description`
- `createdAt`
- `updatedAt`
- `dueDate`
- `amountBrl`
- `amountUsd`
- `type`: `payable` ou `receivable`
- `status`: `pending`, `paid` ou `received`
- `category`
- `tags`
- `recurrence`: `none`, `monthly` ou `yearly`
- `recurrenceParentId`
- `collaboratorEmails`
- `deleted`
- `deletedAt`

### Recuperacao de Senha

- `password_reset_tokens` salva hash do token.
- Token expira e deve ser marcado como usado.
- No MVP, o token e exibido localmente na tela. Nao ha envio real de email.

## Regras de Dominio

- Contas nunca devem ser apagadas fisicamente pelo fluxo do usuario.
- Exclusao de conta deve marcar `deleted = true` e preencher `deletedAt`.
- Contas com `deleted = true` nao aparecem no dashboard.
- Conta `payable` pode ter status `pending` ou `paid`.
- Conta `receivable` pode ter status `pending` ou `received`.
- Recorrencia `monthly` ou `yearly` deve gerar 6 ocorrencias futuras no cadastro.
- Contas compartilhadas aparecem para o dono e para usuarios cujo email esteja em `collaboratorEmails`.
- Cotacao BRL/USD vem de `EXCHANGE_RATE_BRL_USD`, com fallback local.

## Autenticacao

O app deve ter:

- Login.
- Cadastro.
- Logout.
- Recuperacao de senha por token local.
- Sessao por cookie HTTP-only.

Seed obrigatoria:

- Email: `admin@flowclash.com`
- Senha: `@flowcash123`
- Perfil: `admin`

## Seed

O seed deve criar:

- Super-usuario/admin.
- 5 contas de exemplo.

As contas devem cobrir:

- A pagar.
- A receber.
- Vencidas.
- A vencer nos proximos 7 dias.
- Pagas ou recebidas.
- Categorias/tags.
- Pelo menos uma recorrencia.

## Pagina Principal

A pagina inicial autenticada deve ter:

- Header com usuario, tema e logout.
- Cards de metricas.
- Cards de contas.
- Tabela de contas.
- Grafico moderno e interativo.
- Botao para criar nova conta.
- Clique em card/linha abre edicao.
- Notificacoes internas para contas vencidas e proximas do vencimento.
- Importacao CSV.
- Exportacao CSV.
- Impressao/PDF pelo navegador.
- Filtro por titulo, descricao, categoria, tags e colaboradores.

## Visual

Direcao visual:

- Interface moderna com dark mode e light mode.
- Cores suaves com destaque azul brilhante.
- Fundo com linhas verticais e horizontais finas.
- Efeitos de transparencia e blur.
- Cards e dialogos com glassmorphism.
- Bordas com brilho azul no hover.
- Animacoes suaves em transicoes, dialogos, hover e clique.
- Tela de login dividida:
  - Lado esquerdo com nome do projeto, chamada e elementos animados.
  - Lado direito com formulario de login/cadastro/recuperacao.

## Regras de Implementacao

- Preferir server actions para operacoes de CRUD.
- Validar dados de entrada com Zod.
- Manter TypeScript estrito.
- Manter soft delete para contas.
- Nao exibir contas apagadas.
- Nao usar exclusao fisica para contas no fluxo de usuario.
- Checar posse ou colaboracao antes de editar/apagar conta.
- Manter componentes reutilizaveis em `src/components`.
- Manter acesso ao banco em `src/db`.
- Manter funcoes auxiliares em `src/lib`.
- Evitar adicionar bibliotecas sem necessidade clara.
- Depois de mudar schema, lembrar de rodar `bun run db:push`.
- Depois de alterar seed/schema, validar com `bun run build`.

## CSV

Formato esperado para importacao:

```text
title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails
```

## Variaveis de Ambiente

```bash
DATABASE_URL=postgres://flowcash:flowcash@localhost:5432/flowcash
AUTH_SECRET=change-me-with-a-long-random-secret
EXCHANGE_RATE_BRL_USD=5.15
```

## Comandos Esperados

```bash
bun install
bun run dev
bun run build
bun run db:push
bun run db:seed
```

## Docker

O projeto deve ter `docker-compose.yml` com:

- App Next.js/Bun.
- Postgres.
- Volume persistente para Postgres.
- Schema/seed aplicados na subida do app.

Comando:

```bash
docker compose up --build
```

## Documentacao

Arquivos de referencia:

- `PRD.md`: requisitos de produto.
- `SDD.md`: design tecnico.
- `SPEC.MD`: especificacao consolidada.
- `AGENTS.md`: instrucoes para agentes.
- `CLAUDE.md`: instrucoes equivalentes para Claude.

Ao mudar comportamento, atualizar a documentacao correspondente.

## Observacoes

- Preserve arquivos e alteracoes existentes que nao tenham relacao direta com a tarefa atual.
- A pasta `.serena/` pode existir localmente e nao deve ser modificada sem pedido explicito.
- `prompt-principal.md` pode ter sido movido para `prompts/prompt-principal.md`; nao reverter sem confirmacao.
