# SDD - FlowCash

## 1. Visao Tecnica

FlowCash e uma aplicacao web full-stack em Next.js com App Router, usando Postgres como banco relacional e Drizzle ORM para modelagem, queries e migrations. A UI e construida com React, Tailwind CSS e componentes no estilo ShadCN/UI.

O sistema sera monolitico no MVP: frontend, backend, autenticacao, server actions e acesso ao banco vivem no mesmo projeto Next.js.

## 2. Stack

- Runtime: Bun
- Framework: Next.js
- Linguagem: TypeScript
- UI: React, Tailwind CSS, ShadCN/UI
- Icones: Lucide React
- Graficos: Recharts
- Validacao: Zod
- Forms: server actions, `useActionState` e componentes controlados quando necessario
- ORM: Drizzle ORM
- Banco: Postgres
- Auth: cookie HTTP-only com token assinado ou sessao persistida
- Infra local: Docker Compose

## 3. Arquitetura

```text
Browser
  |
  | HTTP / Server Actions
  v
Next.js App Router
  |
  | auth helpers / validation / services
  v
Drizzle ORM
  |
  v
Postgres
```

Camadas esperadas:

- `src/app`: rotas, layouts, paginas e server actions.
- `src/components`: componentes reutilizaveis de UI e dominio.
- `src/components/ui`: componentes base no estilo ShadCN/UI.
- `src/db`: conexao Drizzle, schema e queries de banco.
- `src/lib`: autenticacao, validacao, formatos e utilitarios.
- `src/scripts`: seed e scripts operacionais.

Estado atual relevante:

- `src/lib/validators.ts` centraliza schemas Zod v4 para auth, contas, CSV, recuperacao de senha e administracao.
- `src/lib/dashboard-layout.ts` normaliza, serializa e reordena blocos do dashboard.
- `src/components/dashboard.tsx` implementa cards, tabela, grafico Recharts, CSV, PDF/impressao, notificacoes e drag-and-drop.
- `src/app/admin/page.tsx` implementa o painel SaaS administrativo.
- `docs/UI-PARTNER.md` e a referencia visual para novas telas e componentes.

## 4. Modelo de Dados

### tenants

Representa uma organizacao/conta SaaS isolada.

Campos:

- `id`: UUID primary key.
- `name`: texto.
- `plan`: enum `free`, `standard`, `business`.
- `payableLimit`: numeric inteiro; `0` significa ilimitado.
- `receivableLimit`: numeric inteiro; `0` significa ilimitado.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.

### users

Armazena usuarios autenticaveis.

Campos:

- `id`: UUID ou serial primary key.
- `tenantId`: referencia para `tenants.id`.
- `name`: texto.
- `email`: texto unico.
- `passwordHash`: texto.
- `role`: enum `user`, `super-user`, `admin`, `standard`, `free`; `user` e legado/compatibilidade, enquanto fluxos atuais usam `super-user`, `admin`, `standard` e `free`.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.

Indices:

- unique index em `email`.

### accounts

Armazena contas a pagar e a receber.

Campos:

- `id`: UUID ou serial primary key.
- `tenantId`: referencia para `tenants.id`.
- `userId`: referencia para `users.id`.
- `title`: texto.
- `description`: texto.
- `createdAt`: timestamp.
- `updatedAt`: timestamp.
- `dueDate`: date ou timestamp.
- `amountBrl`: numeric com escala 2.
- `amountUsd`: numeric com escala 2.
- `type`: enum/texto com `payable` e `receivable`.
- `status`: enum/texto com `pending`, `paid` e `received`.
- `deleted`: boolean default `false`.
- `deletedAt`: timestamp nullable.
- `category`: texto.
- `tags`: texto separado por virgula.
- `recurrence`: enum `none`, `monthly`, `yearly`.
- `recurrenceParentId`: UUID opcional.
- `collaboratorEmails`: texto com emails separados por virgula.

### password_reset_tokens

Armazena tokens locais de recuperacao de senha.

Campos:

- `id`: UUID.
- `userId`: referencia para `users.id`.
- `tokenHash`: hash bcrypt do token.
- `expiresAt`: timestamp.
- `usedAt`: timestamp nullable.
- `createdAt`: timestamp.

Indices:

- index em `userId`.
- index em `dueDate`.
- index composto em `tenantId`, `deleted`, `dueDate`.
- index composto em `tenantId`, `type`, `status`.

Regra importante:

- Nunca executar delete fisico em `accounts` para operacoes de usuario.
- Exclusao deve atualizar `deleted = true` e `deletedAt = now()`.

## 5. Enums e Regras de Dominio

### AccountType

- `payable`: conta a pagar.
- `receivable`: conta a receber.

### AccountStatus

- `pending`: pendente.
- `paid`: paga.
- `received`: recebida.

Regras:

- Uma conta `payable` pode ficar `pending` ou `paid`.
- Uma conta `receivable` pode ficar `pending` ou `received`.
- O backend deve validar combinacoes invalidas.
- Contas vencidas sao `pending` com `dueDate < hoje`.
- Contas a vencer nos proximos 7 dias sao `pending` com `dueDate >= hoje` e `dueDate <= hoje + 7 dias`.
- Contas recorrentes geram 6 ocorrencias futuras no momento da criacao.
- Contas compartilhadas podem ser acessadas pelo dono ou por emails em `collaboratorEmails`.
- Plano `free` limita 10 contas `payable` e 10 contas `receivable`.
- Limite `0` no tenant significa ilimitado.
- Criacao recorrente consome 7 unidades do limite da respectiva `type`.

## 6. Autenticacao e Autorizacao

### Fluxo de Cadastro

1. Usuario envia nome, email e senha.
2. Zod valida entrada.
3. Sistema verifica se email ja existe.
4. Senha e convertida para hash com bcrypt.
5. Um tenant e criado para o usuario.
6. Usuario e criado no banco.
7. Primeiro usuario do sistema recebe `super-user`; demais cadastros recebem `admin`.
8. Sistema cria sessao e redireciona para dashboard.

### Fluxo de Login

1. Usuario envia email e senha.
2. Sistema busca usuario por email.
3. bcrypt compara senha com `passwordHash`.
4. Em caso valido, sistema cria cookie HTTP-only.
5. Usuario e redirecionado ao dashboard.

### Fluxo de Recuperacao

1. Usuario informa email.
2. Sistema gera token aleatorio, salva hash e validade de 30 minutos.
3. No MVP local, o token e exibido na tela.
4. Usuario informa token e nova senha.
5. Sistema valida token, atualiza senha com hash e marca token como usado.

### Sessao

Para o MVP, usar cookie HTTP-only assinado com segredo em `AUTH_SECRET`.

Cookie recomendado:

- Nome: `flowcash_session`
- Flags: `httpOnly`, `sameSite=lax`, `secure` em producao, `path=/`
- Payload minimo: `userId`, `email`, `role`, `tenantId`

### Protecao de Dados

- `super-user` pode acessar contas de todos os tenants.
- `admin` pode acessar todas as contas do seu tenant.
- `standard` e `free` podem acessar contas proprias e contas compartilhadas por email.
- Todas as queries de contas devem filtrar por `tenantId`, exceto visao global do `super-user`.
- Rotas autenticadas devem redirecionar usuario sem sessao para login.
- Usuario sem permissao nao deve acessar dados fora de seu tenant.

## 7. Principais Telas

### Login/Cadastro

Rota sugerida:

- `/login`

Layout:

- Tela dividida.
- Lado esquerdo: marca FlowCash, proposta de valor e elementos animados.
- Lado direito: abas ou alternancia entre login e cadastro.

### Dashboard

Rota sugerida:

- `/`
- `/admin`

Componentes:

- Header com usuario, botao de tema e logout.
- Cards de metricas.
- Lista de contas em cards.
- Tabela de contas.
- Grafico interativo.
- Botao de nova conta.
- Dialog de criar/editar conta.
- Importador CSV.
- Exportador CSV.
- Botao de impressao/PDF.
- Notificacoes internas.
- Filtro por texto/categoria/tag.
- Blocos reorganizaveis por drag-and-drop com ordem persistida no navegador.

### Administracao

Rota:

- `/admin`

Responsabilidades:

- Listar tenants, planos, limites e uso de contas.
- Listar usuarios com tenant e papel.
- Permitir que `super-user` altere tenant, papel, plano e limites.
- Permitir que `admin` altere usuarios apenas do proprio tenant.
- Bloquear `standard` e `free`.

## 8. Server Actions e API Interna

Preferir server actions para o MVP.

Acoes sugeridas:

- `registerAction(_, formData)`
- `loginAction(_, formData)`
- `logoutAction()`
- `createAccountAction(formData)`
- `updateAccountAction(accountId, formData)`
- `softDeleteAccountAction(accountId)`
- `requestPasswordResetAction(_, formData)`
- `resetPasswordAction(_, formData)`
- `importCsvAction(formData)`
- `updateAdminUserAction(formData)`
- `createAdminUserAction(formData)`
- `deleteAdminUserAction(formData)`
- `createAdminTenantAction(formData)`
- `updateAdminTenantAction(formData)`

Validacao:

- Cada action deve validar entrada com Zod.
- Schemas ficam em `src/lib/validators.ts` e usam `safeParse`, coercoes de numero/data, `z.enum`, `superRefine` para status coerente com tipo e transform para categoria vazia virar `Geral`.
- Actions de conta devem exigir usuario autenticado.
- Actions devem retornar erros estruturados para o formulario.
- Actions administrativas devem validar papel, tenant e impedir alteracao indevida de `super-user`.

## 9. Consultas do Dashboard

O dashboard pode buscar todas as contas visiveis do usuario e calcular metricas no servidor.

Filtro base:

```sql
where user_id = current_user_id
  and deleted = false
```

Filtro multi-tenant:

```sql
where tenant_id = current_tenant_id
  and deleted = false
```

Metricas:

- `overdue`: contas pendentes com vencimento anterior a hoje.
- `dueSoon`: contas pendentes com vencimento entre hoje e hoje + 7 dias.
- `settled`: contas com status `paid` ou `received`.
- `totalPayableBrl`: soma de contas `payable`.
- `totalReceivableBrl`: soma de contas `receivable`.

Para o MVP, os calculos podem ser feitos em TypeScript apos buscar as contas. Se o volume crescer, migrar para agregacoes SQL.

## 10. UI e Design System

### Tokens

Usar CSS variables para:

- `background`
- `foreground`
- `card`
- `border`
- `primary`
- `muted`
- `destructive`

### Componentes Base

Componentes esperados:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Dialog`
- `Card`
- `Badge`
- `Table`
- `Tabs`
- `ThemeToggle`

### Estilo

- Cards com `backdrop-blur`.
- Fundo com grid sutil usando pseudo-elementos ou backgrounds CSS.
- Bordas com hover azul brilhante.
- Transicoes em `transform`, `box-shadow`, `border-color` e `opacity`.
- Dialogos com overlay escuro/translucido.

## 11. Docker Compose

Servicos esperados:

- `db`: Postgres.
- `app`: Next.js/Bun.

Variaveis:

```bash
POSTGRES_USER=flowcash
POSTGRES_PASSWORD=flowcash
POSTGRES_DB=flowcash
DATABASE_URL=postgres://flowcash:flowcash@db:5432/flowcash
AUTH_SECRET=change-me
EXCHANGE_RATE_BRL_USD=5.15
```

Portas:

- App: `3000`
- Postgres: `5432`

Volume:

- Volume nomeado para dados do Postgres.

## 12. Seed

Script:

```bash
bun run db:seed
```

Responsabilidades:

- Criar admin `admin@flowclash.com`.
- Hash da senha `@flowcash123`.
- Criar 5 contas vinculadas ao admin.
- Seed deve ser idempotente quando possivel.

## 13. Migrations

Comandos:

```bash
bun run db:generate
bun run db:migrate
bun run db:push
```

Durante desenvolvimento inicial, `db:push` pode ser usado para acelerar. Antes de producao, preferir migrations versionadas geradas pelo Drizzle.

## 14. Tratamento de Valores Monetarios

No banco:

- Usar `numeric(12, 2)` para BRL e USD.

No TypeScript:

- Tratar valores vindos do banco como string ou converter com cuidado para numero apenas para exibicao e calculos simples.
- Evitar floats para regras financeiras sensiveis.

No MVP:

- Valores de dashboard podem ser calculados como `Number(amount)` por simplicidade.
- Evolucao futura deve usar inteiros em centavos ou biblioteca decimal.

## 14.1 Cotacao BRL/USD

O MVP usa `EXCHANGE_RATE_BRL_USD` como cotacao configuravel por ambiente. O cliente calcula USD a partir de BRL no formulario. Integracao automatica com provider externo fica como evolucao.

## 14.2 Importacao e Exportacao

Importacao CSV usa formato simples com cabecalho opcional:

```text
title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails
```

Exportacao CSV roda no cliente para as contas atualmente filtradas. PDF usa a impressao nativa do navegador.

## 15. Seguranca

- Senhas com bcrypt.
- Cookie HTTP-only.
- `AUTH_SECRET` obrigatorio fora de desenvolvimento.
- Validacao server-side obrigatoria.
- Filtrar todas as contas por `userId`.
- Permitir acesso a contas compartilhadas via `collaboratorEmails`.
- Nao confiar em IDs enviados pelo cliente sem checar posse do recurso.
- Evitar vazar se um email existe em mensagens publicas sensiveis.

## 16. Testes e Verificacao

Verificacoes minimas:

- `bun run build`
- `bun test`
- Fluxo manual de cadastro.
- Fluxo manual de login com admin seed.
- Criar conta.
- Editar conta.
- Apagar conta e confirmar que nao aparece mais.
- Confirmar no banco que conta apagada ainda existe com `deleted = true`.
- Alternar dark/light mode.
- Gerar token local e resetar senha.
- Criar conta recorrente e verificar ocorrencias futuras.
- Importar CSV.
- Exportar CSV e gerar PDF.
- Compartilhar conta com email de colaborador.
- Validar responsividade em desktop e mobile.

## 17. Estado de Implementacao Atual

- Projeto configurado com Next.js, Tailwind, Drizzle, Bun e Docker Compose.
- Schema Drizzle cobre tenants, users, accounts e password reset tokens.
- Auth, cadastro, login, logout e recuperacao local por token estao implementados.
- CRUD de contas usa server actions, Zod e soft delete.
- Dashboard calcula metricas, renderiza cards/tabela/grafico e permite reorganizar blocos.
- CSV, exportacao, impressao/PDF, recorrencia, categorias, tags e colaboradores estao implementados.
- Modulo `/admin` cobre gestao SaaS de usuarios e tenants conforme permissoes.
- Testes automatizados cobrem layout reorganizavel e validadores Zod.

## 18. Decisoes Tecnicas Iniciais

- Usar monolito Next.js para reduzir complexidade no MVP.
- Usar server actions para evitar uma camada REST desnecessaria.
- Usar Drizzle por tipagem forte e controle explicito de schema.
- Usar soft delete somente na tabela `accounts`, pois e o requisito central de historico.
- Usar Recharts por integracao simples com React e boa customizacao visual.
- Usar Zod v4 como fronteira server-side para normalizar entradas antes de tocar no banco.
- Persistir ordem do dashboard no navegador para evitar tabela adicional no MVP.

## 19. Possiveis Evolucoes

- Migrar sessao para tabela `sessions` se houver necessidade de invalidacao individual.
- Criar filtros por periodo.
- Criar pagina de relatorios.
- Adicionar cotacao BRL/USD automatica.
- Adicionar auditoria de alteracoes.
- Criar permissoes granulares para colaboradores.
