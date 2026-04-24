# PRD - FlowCash

## 1. Visao Geral

FlowCash e um aplicativo web para controle financeiro pessoal focado em contas a pagar e a receber. O produto deve permitir que uma pessoa acompanhe vencimentos, valores, status de pagamento/recebimento e historico de contas sem perder registros apagados.

O MVP deve entregar uma experiencia completa de autenticacao, dashboard, CRUD de contas, visual moderno com dark/light mode e dados iniciais para demonstracao.

## 2. Objetivo

Criar uma aplicacao simples, bonita e funcional para que usuarios gerenciem suas contas pessoais com clareza sobre:

- O que esta vencido.
- O que vence nos proximos 7 dias.
- O que ja foi pago ou recebido.
- O saldo previsto entre contas a pagar e a receber.

## 3. Publico-Alvo

Pessoas que querem controlar financas pessoais de forma visual, sem depender de planilhas.

Perfis principais:

- Usuario individual que registra despesas e recebimentos.
- Usuario que acompanha vencimentos semanalmente.
- Usuario que precisa revisar rapidamente contas pagas, recebidas, vencidas e pendentes.

## 4. Problema

Controles manuais em planilhas ou anotações soltas dificultam a visualizacao de vencimentos, status e impacto financeiro. O usuario precisa de uma tela unica que mostre prioridades e permita agir rapidamente.

## 5. Solucao

Um app web com login, cadastro e dashboard centralizado. A pagina principal mostra cards, tabela, indicadores e grafico das contas. O usuario pode criar, editar e apagar contas sem remocao fisica do banco.

## 6. Escopo do MVP

### Incluido

- Login de usuario.
- Cadastro de usuario.
- Seed com super-usuario.
- Seed com 5 contas de exemplo.
- Listagem de contas em cards.
- Tabela de contas.
- Grafico de contas por status/tipo.
- Indicadores de dashboard:
  - Contas vencidas.
  - Contas a vencer nos proximos 7 dias.
  - Contas pagas/recebidas.
- Criacao de conta.
- Edicao de conta ao clicar em um card ou registro.
- Exclusao logica de conta.
- Light mode e dark mode.
- Docker Compose para app e Postgres.
- Recuperacao de senha por token local.
- Contas recorrentes mensais e anuais.
- Categorias e tags.
- Importacao bancaria por CSV.
- Exportacao CSV e impressao/PDF.
- Cotacao BRL/USD configuravel.
- Notificacoes internas no dashboard.
- Compartilhamento de contas por email de colaborador.
- SaaS multi-tenant com planos, papeis e limites por quantidade de contas.
- Modulo de administracao para gerenciar usuarios, tenants, planos e limites.

### SaaS e Multi-Tenant

- Cada cadastro cria um tenant proprio.
- O primeiro usuario cadastrado vira `super-user`, com acesso global.
- Cadastros seguintes viram `admin` do proprio tenant.
- Papeis suportados: `super-user`, `admin`, `standard`, `free`.
- Planos suportados: `free`, `standard`, `business`.
- Plano `free` limita 10 contas `payable` e 10 contas `receivable`.
- Limite `0` significa ilimitado.
- Recorrencia mensal/anual consome 7 unidades do limite: conta original + 6 futuras.
- `admin` acessa todas as contas do seu tenant.
- `standard` e `free` acessam contas proprias e compartilhadas por `collaboratorEmails`.
- `/admin` permite ao `super-user` coordenar todos os usuarios e tenants.
- `/admin` permite ao `admin` coordenar usuarios apenas do proprio tenant.
- Somente `super-user` altera plano e limites de tenants.

### RF16 - Administracao SaaS

O sistema deve ter modulo administrativo em `/admin`.

Critérios de aceite:

- `super-user` visualiza todos os tenants, usuarios, papeis, planos e uso de limites.
- `super-user` altera papel e tenant de usuarios.
- `super-user` altera plano, nome e limites de tenants.
- `admin` visualiza e altera usuarios apenas do proprio tenant.
- `admin` nao altera plano, limites, tenant externo ou `super-user`.
- Usuarios `standard` e `free` nao acessam `/admin`.

### Fora do Escopo Inicial

- Envio real de email, push ou WhatsApp.
- Integracao bancaria direta/Open Finance.
- Billing real, checkout e cobranca recorrente.
- Cotacao automatica via provider externo em producao.

## 7. Requisitos Funcionais

### RF01 - Cadastro

O usuario deve conseguir criar uma conta com nome, email e senha.

Critérios de aceite:

- Email deve ser unico.
- Senha deve ser armazenada com hash.
- Apos cadastro bem-sucedido, o usuario pode acessar o app.

### RF02 - Login

O usuario deve conseguir entrar com email e senha.

Critérios de aceite:

- Credenciais invalidas exibem erro claro.
- Login bem-sucedido cria sessao.
- Usuario autenticado e redirecionado para o dashboard.

### RF03 - Logout

O usuario deve conseguir encerrar a sessao.

Critérios de aceite:

- Sessao e removida.
- Usuario retorna para a tela de login.

### RF04 - Criar Conta

O usuario deve conseguir criar uma conta a pagar ou a receber.

Campos obrigatorios:

- Titulo.
- Descricao/conteudo.
- Data de vencimento.
- Valor em reais.
- Valor em dolar.
- Tipo: pagar ou receber.
- Situacao/status.

Critérios de aceite:

- Conta criada aparece no dashboard.
- Conta pertence ao usuario autenticado.
- Dados invalidos sao bloqueados por validacao.

### RF05 - Editar Conta

O usuario deve conseguir clicar em uma conta e editar seus dados.

Critérios de aceite:

- Formulario abre preenchido com os dados atuais.
- Alteracoes salvas atualizam cards, tabela e grafico.
- Usuario nao pode editar contas de outro usuario.

### RF06 - Excluir Conta

O usuario deve conseguir apagar uma conta.

Critérios de aceite:

- Registro nao e removido do banco.
- Campo `deleted` passa para `true`.
- Campo `deletedAt` recebe a data/hora da exclusao.
- Conta apagada nao aparece mais no dashboard.

### RF07 - Dashboard

O usuario deve visualizar um resumo financeiro.

Indicadores:

- Total vencido.
- Total a vencer nos proximos 7 dias.
- Total pago/recebido.
- Totais por tipo: pagar e receber.

Critérios de aceite:

- Apenas contas nao apagadas entram nos calculos.
- Vencidas sao contas pendentes com vencimento anterior ao dia atual.
- Proximos 7 dias inclui contas pendentes com vencimento entre hoje e 7 dias a frente.

### RF08 - Visualizacao em Cards e Tabela

O usuario deve ver contas em cards e em tabela.

Critérios de aceite:

- Cards mostram titulo, tipo, status, vencimento e valores.
- Tabela permite leitura rapida de todas as contas.
- Clicar em uma conta abre edicao.

### RF09 - Graficos

O dashboard deve conter grafico moderno e interativo.

Critérios de aceite:

- Grafico usa Recharts ou Chart.js.
- Deve representar contas vencidas, a vencer e pagas/recebidas.
- O visual deve respeitar dark/light mode.

### RF10 - Recuperacao de Senha

O usuario deve conseguir gerar um token local de recuperacao e definir uma nova senha.

### RF11 - Recorrencia

O usuario deve conseguir marcar conta como mensal ou anual. O sistema gera 6 proximas ocorrencias.

### RF12 - Categorias, Tags e Filtros

O usuario deve classificar contas por categoria e tags, alem de filtrar o dashboard por esses campos.

### RF13 - Importacao e Exportacao

O usuario deve importar contas por CSV, exportar contas filtradas em CSV e gerar PDF pela impressao do navegador.

### RF14 - Cotacao BRL/USD

O formulario deve calcular valor em dolar a partir do valor em reais usando `EXCHANGE_RATE_BRL_USD`.

### RF15 - Notificacoes e Colaboracao

O dashboard deve destacar contas urgentes e permitir compartilhar uma conta com colaboradores por email.

## 8. Requisitos Nao Funcionais

- A aplicacao deve usar Next.js com App Router.
- O runtime principal deve ser Bun.
- O banco deve ser Postgres.
- O ORM deve ser Drizzle ORM.
- A UI deve usar Tailwind e componentes no estilo ShadCN/UI.
- A aplicacao deve ser responsiva.
- O codigo deve usar TypeScript estrito.
- Entradas de formulario devem ser validadas com Zod.
- Senhas nao podem ser armazenadas em texto puro.
- Operacoes de banco devem filtrar por usuario autenticado.
- Operacoes de banco devem respeitar `tenantId`, papel do usuario e limite do plano.

## 9. Direcao Visual

O visual deve seguir uma estetica moderna com profundidade e acabamento premium:

- Dark mode e light mode.
- Cores suaves com destaque azul brilhante.
- Fundo com linhas verticais e horizontais finas.
- Transparencia e blur em cards e dialogos.
- Cards com bordas sutis e efeito de brilho azul no hover.
- Transicoes suaves para hover, clique e abertura de dialogos.
- Tela de login dividida:
  - Lado esquerdo com nome FlowCash, proposta de valor e elementos animados.
  - Lado direito com formulario de login/cadastro.

## 10. Dados Iniciais

Seed obrigatoria:

- Usuario admin:
  - Email: `admin@flowclash.com`
  - Senha: `@flowcash123`
  - Perfil: `super-user`
  - Tenant: `FlowCash Global`
  - Plano: `business`
- 5 contas de exemplo:
  - Pelo menos uma conta a pagar vencida.
  - Pelo menos uma conta a receber vencida.
  - Pelo menos uma conta a vencer nos proximos 7 dias.
  - Pelo menos uma conta paga.
  - Pelo menos uma conta recebida.

## 11. Metricas de Sucesso

- Usuario consegue criar uma conta em menos de 30 segundos.
- Dashboard comunica contas urgentes sem precisar abrir outra tela.
- CRUD completo funciona sem perda fisica de dados.
- App roda localmente com Docker Compose e Bun.
- Build de producao conclui sem erros.

## 12. Riscos

- Escopo visual pode crescer alem do MVP.
- Autenticacao propria exige cuidado com sessoes e hash de senha.
- Valores monetarios precisam ser tratados com tipos seguros no banco.
- Dark/light mode precisa ser verificado em todos os componentes.

## 13. Roadmap Pos-MVP

- Filtros avancados por periodo, tipo e status.
- Anexos em contas.
- Email real para recuperacao e notificacoes.
- Open Finance/importacao bancaria direta.
- Permissoes granulares para colaboradores.
