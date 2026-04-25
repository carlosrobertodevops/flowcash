# SPEC - FlowCash

## 1. Resumo

FlowCash e um aplicativo web de controle financeiro pessoal para gerenciar contas a pagar e a receber. O sistema deve permitir cadastro/login de usuario, criacao, edicao, visualizacao e exclusao logica de contas, mantendo historico no banco.

## 2. Objetivo do MVP

Entregar uma aplicacao funcional com:

- Autenticacao de usuario.
- Dashboard financeiro.
- CRUD completo de contas.
- Soft delete.
- Seed com admin e contas de exemplo.
- Interface moderna com dark/light mode.
- Execucao local com Bun e Docker Compose.
- Recuperacao de senha por token local.
- Contas recorrentes.
- Categorias e tags.
- Importacao bancaria por CSV.
- Exportacao CSV e impressao/PDF.
- Cotacao BRL/USD configuravel.
- Notificacoes internas no dashboard.
- Colaboradores por email em contas compartilhadas.
- SaaS multi-tenant com tenants, papeis e limites por plano.
- Modulo administrativo para coordenar usuarios, tenants, planos e limites.
- Dashboard reorganizavel por arrastar e soltar, com ordem persistida no navegador.
- Validacao server-side centralizada com Zod v4.

## 3. Stack Obrigatoria

- Bun
- Next.js com App Router
- TypeScript
- React
- Tailwind CSS
- ShadCN/UI ou componentes no mesmo padrao visual
- Drizzle ORM
- Postgres
- Recharts ou Chart.js
- Zod
- Docker Compose

## 4. Entidades

### Usuario

Campos:

- `id`
- `tenantId`
- `name`
- `email`
- `passwordHash`
- `role`
- `createdAt`
- `updatedAt`

Regras:

- Email deve ser unico.
- Senha deve ser salva com hash.
- `role` pode ser `super-user`, `admin`, `standard` ou `free`.

### Tenant

Campos:

- `id`
- `name`
- `plan`: `free`, `standard` ou `business`
- `payableLimit`
- `receivableLimit`
- `createdAt`
- `updatedAt`

Regras:

- Cada cadastro cria um tenant.
- Primeiro usuario cadastrado vira `super-user`.
- Cadastros seguintes viram `admin` do tenant criado.
- Plano `free` limita 10 contas a pagar e 10 contas a receber.
- Limite `0` significa ilimitado.

### Conta

Campos:

- `id`
- `tenantId`
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
- `deleted`
- `deletedAt`
- `category`
- `tags`
- `recurrence`
- `recurrenceParentId`
- `collaboratorEmails`

Regras:

- Conta nunca deve ser apagada fisicamente pelo fluxo do usuario.
- Ao apagar, marcar `deleted = true` e preencher `deletedAt`.
- Contas com `deleted = true` nao aparecem no app.
- Conta `payable` pode ser `pending` ou `paid`.
- Conta `receivable` pode ser `pending` ou `received`.
- Recorrencia `monthly` ou `yearly` gera as proximas 6 contas no cadastro.
- Colaboradores informados por email podem visualizar e editar a conta compartilhada.
- Criacao e importacao respeitam os limites `payableLimit` e `receivableLimit` do tenant.
- Criacao recorrente consome 7 unidades do limite da respectiva `type`.

## 5. Autenticacao

O sistema deve ter:

- Tela de login.
- Tela ou modo de cadastro.
- Logout.
- Recuperacao de senha.
- Sessao via cookie HTTP-only.
- Protecao das paginas autenticadas.

Seed obrigatoria:

- Email: `admin@flowclash.com`
- Senha: `@flowcash123`
- Role: `super-user`
- Tenant: `FlowCash Global`
- Plano: `business`

## 6. Dashboard

A pagina principal autenticada deve exibir:

- Header com nome/email do usuario.
- Tenant, role, plano e uso de limite de contas.
- Botao de logout.
- Toggle dark/light mode.
- Botao para criar nova conta.
- Cards de indicadores.
- Cards de contas.
- Tabela de contas.
- Grafico moderno e interativo.
- Cards, resumo visual e tabela devem ser reorganizaveis por arrastar e soltar.
- A ordem dos blocos do dashboard deve persistir no navegador ao reabrir o app.

Indicadores obrigatorios:

- Contas vencidas.
- Contas a vencer nos proximos 7 dias.
- Contas pagas/recebidas.
- Saldo previsto ou resumo financeiro.

Definicoes:

- Conta vencida: `status = pending` e `dueDate < hoje`.
- Conta a vencer: `status = pending` e `dueDate` entre hoje e hoje + 7 dias.
- Conta finalizada: `status = paid` ou `status = received`.

## 7. CRUD de Contas

### Criar

O usuario deve preencher:

- Titulo.
- Descricao.
- Data de vencimento.
- Valor em reais.
- Valor em dolar.
- Tipo.
- Status.

### Editar

Ao clicar em um card ou linha da tabela:

- Abrir formulario com dados preenchidos.
- Permitir alterar campos.
- Salvar e atualizar dashboard.

### Apagar

Ao apagar:

- Nao executar `DELETE`.
- Atualizar `deleted` e `deletedAt`.
- Remover da interface.

## 8. Seed

O seed deve criar:

- Tenant global.
- Usuario `super-user`.
- 5 contas de exemplo.

As contas devem cobrir:

- A pagar vencida.
- A receber pendente.
- A vencer nos proximos 7 dias.
- Paga.
- Recebida.

O seed deve ser idempotente sempre que possivel.

## 9. Features Avancadas do MVP

### Recuperacao de Senha

- Usuario informa email.
- Sistema gera token local com validade de 30 minutos.
- Usuario informa token e nova senha.
- Senha e atualizada com hash.

### Recorrencia

- Conta pode ser sem recorrencia, mensal ou anual.
- Ao criar conta recorrente, o sistema gera 6 ocorrencias futuras.

### Categorias e Tags

- Cada conta tem categoria.
- Cada conta pode ter tags em texto separado por virgula.
- Dashboard permite filtrar por titulo, descricao, categoria, tags e colaboradores.

### Importacao Bancaria

- Dashboard aceita CSV no formato:

```text
title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails
```

### Exportacao

- Exportar contas filtradas para CSV.
- Gerar PDF usando impressao do navegador.

### Cotacao

- `EXCHANGE_RATE_BRL_USD` define a cotacao usada para calcular USD a partir de BRL.

### Notificacoes

- Dashboard exibe contas vencidas e a vencer nos proximos 7 dias como alertas internos.

### Colaboracao

- Contas aceitam emails de colaboradores separados por virgula.
- Colaboradores conseguem ver e editar contas compartilhadas.

### SaaS Multi-Tenant

- `super-user` acessa todos os tenants.
- `admin` acessa todas as contas do proprio tenant.
- `standard` e `free` acessam contas proprias e compartilhadas.
- Contas sempre recebem `tenantId`.
- Dashboard de usuario nao `super-user` filtra por `tenantId`.
- Limites sao aplicados antes de criar contas manualmente ou via CSV.

### Administracao SaaS

- `/admin` e acessivel por `super-user` e `admin`.
- `super-user` visualiza todos os tenants e usuarios.
- `super-user` altera papel, tenant, plano e limites.
- `admin` visualiza usuarios do proprio tenant.
- `admin` altera papel de usuarios do proprio tenant para `admin`, `standard` ou `free`.
- `admin` nao altera `super-user`, tenant externo, plano ou limites.
- `standard` e `free` sao redirecionados para `/`.

## 10. Visual

Direcao visual:

- Interface moderna.
- Dark mode e light mode.
- Cores suaves com destaque azul brilhante.
- Fundo com linhas finas verticais e horizontais.
- Transparencia e blur.
- Cards e dialogos com glassmorphism.
- Bordas com brilho azul em hover.
- Animacoes suaves em transicoes, dialogos e interacoes.

Login:

- Tela dividida em desktop.
- Lado esquerdo com nome do projeto e chamadas visuais.
- Lado direito com formulario.
- Em mobile, formulario deve ser priorizado.

## 11. Validacao

Toda entrada do usuario deve ser validada no servidor.

Regras minimas:

- Email valido.
- Senha com minimo de 6 caracteres.
- Titulo com minimo de 2 caracteres.
- Descricao com minimo de 2 caracteres.
- Data de vencimento valida.
- Valores monetarios nao negativos.
- Tipo e status dentro dos enums permitidos.
- Status coerente com tipo da conta.
- Categoria com limite de tamanho.
- Categoria vazia deve ser normalizada para `Geral` no servidor.
- Tags e colaboradores com limite de tamanho.
- Schemas Zod compartilhados devem validar auth, contas, CSV, recuperacao de senha e administracao SaaS.

## 12. Seguranca

- Senha com hash bcrypt.
- Cookie HTTP-only.
- `AUTH_SECRET` configuravel por ambiente.
- Queries de conta devem respeitar `tenantId`, papel do usuario, dono da conta e colaboradores.
- Usuario nao pode editar/apagar conta fora do proprio escopo de acesso.
- Usuario pode editar/apagar conta em que aparece como colaborador.
- Nao exibir contas apagadas.

## 13. Docker

O projeto deve incluir `docker-compose.yml` com:

- Servico `db` com Postgres.
- Servico `app` com Next.js/Bun.
- Volume persistente para dados do Postgres.
- Variavel `DATABASE_URL`.
- Variavel `AUTH_SECRET`.
- Variavel `EXCHANGE_RATE_BRL_USD`.

Comando esperado:

```bash
docker compose up --build
```

## 14. Comandos

```bash
bun install
bun run dev
bun run build
bun test
bun run db:push
bun run db:seed
```

## 15. Estrutura Esperada

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
- `src/components/ui`: componentes base.
- `src/db`: schema e conexao com banco.
- `src/lib`: auth, validacao e utilitarios.
- `src/scripts`: seed.

## 16. Critérios de Aceite

O MVP esta aceito quando:

- `bun run build` conclui sem erros.
- Usuario seed consegue fazer login.
- Usuario consegue criar conta.
- Usuario consegue editar conta.
- Usuario consegue apagar conta com soft delete.
- Contas apagadas nao aparecem no dashboard.
- Dashboard exibe cards, tabela e grafico.
- Dashboard permite mover e encaixar cards, resumo visual e tabela, preservando a ordem ao reabrir.
- IDs invalidos ou duplicados no layout salvo sao descartados com fallback seguro.
- Dark/light mode funciona.
- Docker Compose sobe app e banco.
- Seed cria admin e 5 contas de exemplo.
- Recuperacao de senha por token local funciona.
- Conta recorrente gera proximas ocorrencias.
- Importacao CSV cria contas validas.
- Exportacao CSV baixa arquivo com contas filtradas.
- Impressao/PDF abre fluxo nativo do navegador.
- Cotacao BRL/USD calcula valor em dolar no formulario.
- Colaborador por email visualiza conta compartilhada.
- `bun test` conclui sem falhas para validadores Zod e layout do dashboard.

## 16.1 Estado Atual de Implementacao

- `src/lib/validators.ts` contem os schemas Zod v4 usados pelas server actions.
- `src/components/dashboard.tsx` contem cards, tabela, grafico Recharts, CSV, impressao/PDF, notificacoes e drag-and-drop.
- `src/lib/dashboard-layout.ts` contem normalizacao, serializacao e reordenacao segura dos widgets.
- `src/app/admin/page.tsx` contem gestao SaaS de usuarios e tenants.
- `docs/UI-PARTNER.md` documenta cores, tipografia, cards, dialogos, forms, botoes, badges, tabelas, graficos, animacoes e responsividade.

## 17. Evolucoes Futuras

- Envio real de email para recuperacao de senha.
- Integracao bancaria via OFX/Open Finance.
- Cotacao automatica por provider externo.
- Permissoes granulares por colaborador.
