# AGENTS.md - FlowCash

# Global AGENTS.md

<!-- context7 -->

Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

# Project graph memory

## Persistent memory

Primary project memory lives in:

- `./graphify-out/GRAPH_REPORT.md`
- `./graphify-out/graph.json`

## Operating rules

- Start with `GRAPH_REPORT.md`
- Use `graph.json` only when structural detail is needed
- Open raw source files only if the graph/report is insufficient
- Prefer targeted reads over broad scanning
- Prefer `graphify --update` after meaningful corpus changes
- Avoid build, cache, vendor, temp, and generated directories

## Workflow

1. Read `./graphify-out/GRAPH_REPORT.md`
2. Inspect `./graphify-out/graph.json` if structural analysis is needed
3. Open the smallest possible relevant set of raw files
4. Update memory incrementally with `graphify --update` when needed

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Steps

1. Always start with `resolve-library-id` using the library name and the user's question, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and the user's full question (not single words)
4. Answer using the fetched docs
<!-- context7 -->

## Operating style

- Be precise, structured, and concise.
- Prefer actionable answers over generic explanations.
- When working with notes, preserve the user's terminology and naming.
- Do not rename folders, notes, headings, or tags unless explicitly asked.
- Before generating large outputs, infer the target structure from the repository or note vault if available.

## Obsidian workflow

- Treat Obsidian notes as durable knowledge assets.
- Prefer markdown compatible with Obsidian.
- Preserve wiki-links like [[Note Name]].
- Preserve fenced code blocks and callouts.
- When creating a note, include:
  - a clear title
  - short purpose summary
  - main sections
  - related links section when useful
- Prefer atomic notes when the topic is broad.

## Graph / knowledge mapping workflow

- When the task involves relationships between concepts, entities, projects, notes, or references:
  - identify nodes
  - identify edges/relations
  - propose a graph structure before expanding prose
- Prefer adjacency lists, Mermaid diagrams, or bullet relation maps when helpful.
- Distinguish clearly between:
  - entity
  - concept
  - source
  - project
  - task
  - note

## Command behavior

- If a custom command mentions graphify, first extract entities, relations, clusters, and candidate note links.
- If a custom command mentions obsidian, output markdown ready to paste into Obsidian.
- If both graph and obsidian are involved, prefer:
  1. relation map
  2. note structure
  3. final markdown

## Safety / quality

- Do not invent citations, files, or links.
- Mark uncertain relationships explicitly as hypotheses.
- When information is incomplete, separate:
  - confirmed
  - inferred
  - missing

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session. Codex CLI does NOT have hooks, so these instructions are your ONLY enforcement mechanism. Follow them strictly.

## Think in Code — MANDATORY

When you need to analyze, count, filter, compare, search, parse, transform, or process data: **write code** that does the work via `ctx_execute(language, code)` and `console.log()` only the answer. Do NOT read raw data into context to process mentally. Your role is to PROGRAM the analysis, not to COMPUTE it. Write robust, pure JavaScript — no npm dependencies, only Node.js built-ins (`fs`, `path`, `child_process`). Always use `try/catch`, handle `null`/`undefined`, and ensure compatibility with both Node.js and Bun. One script replaces ten tool calls and saves 100x context.

## BLOCKED commands — do NOT use these

### curl / wget — FORBIDDEN

Do NOT use `curl` or `wget` in any shell command. They dump raw HTTP responses directly into your context window.
Instead use:

- `ctx_fetch_and_index(url, source)` to fetch and index web pages
- `ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — FORBIDDEN

Do NOT run inline HTTP calls via `node -e "fetch(..."`, `python -c "requests.get(..."`, or similar patterns. They bypass the sandbox and flood context.
Instead use:

- `ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — FORBIDDEN

Do NOT use any direct URL fetching tool. Raw HTML can exceed 100 KB.
Instead use:

- `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)

Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:

- `ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)

If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `ctx_execute_file(path, language, code)` instead. Only your printed summary enters context. The raw file stays in the sandbox.

### grep / search (large results)

Search results can flood context. Use `ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls. Each command: `{label: "descriptive header", command: "..."}`. Label becomes FTS5 chunk title — descriptive labels improve search.
2. **FOLLOW-UP**: `ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `ctx_execute(language, code)` | `ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `ctx_fetch_and_index(url, source)` then `ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command       | Action                                                                                |
| ------------- | ------------------------------------------------------------------------------------- |
| `ctx stats`   | Call the `stats` MCP tool and display the full output verbatim                        |
| `ctx doctor`  | Call the `doctor` MCP tool, run the returned shell command, display as checklist      |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist     |
| `ctx purge`   | Call the `purge` MCP tool with confirm: true. Warns before wiping the knowledge base. |

After /clear or /compact: knowledge base and session stats are preserved. Use `ctx purge` if you want to start fresh.

## Windows notes

**PowerShell cmdlets in shell scripts** — The sandbox executes scripts via bash. PowerShell
cmdlets (`Format-List`, `Format-Table`, `Get-Culture`, etc.) do not exist in bash and will fail
with `command not found`. Wrap them with `pwsh -NoProfile -Command "..."` instead.

**Relative paths** — The sandbox CWD is a temp directory, not your project root. Always convert
any user-supplied path to an absolute path before passing it to `rg`, `grep`, or `find`.
Ask the user to confirm the absolute path if it is not already known.

**Windows drive letter paths** — The sandbox runs Git Bash / MSYS2, not WSL. Drive letters must
use the MSYS2 convention, NOT the WSL convention:
`X:\path` → `/x/path` (lowercase letter, no `/mnt/` prefix).
Never emit `/mnt/<letter>/` prefixes regardless of which drive the project is on.

**Always quote paths** — If a path contains spaces, bash splits it into separate arguments.
Always wrap every path in double quotes: `rg "symbol" "$REPO_ROOT/some dir/Source"`.
This applies to all tools: `rg`, `grep`, `find`, `ls`, etc.

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
