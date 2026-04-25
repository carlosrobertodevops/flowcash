# UI-PARTNER - FlowCash

## Proposito

Guia rapido para manter novas telas, componentes e ajustes visuais alinhados ao padrao atual do FlowCash.

Fontes principais no codigo:

- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/ui/*`
- `src/components/dashboard.tsx`
- `src/components/account-dialog.tsx`
- `src/components/auth-panel.tsx`

## Direcao Visual

FlowCash usa uma interface financeira moderna, leve e premium:

- glassmorphism em cards, dialogos, header e controles;
- fundo com grid sutil azul e halos radiais;
- destaque principal em azul sky brilhante;
- apoio semantico com verde para recebiveis, amber para pagaveis e rose para erro/perigo;
- bordas suaves com brilho no hover;
- transicoes curtas, sem animacao excessiva.

## Cores

As cores principais vivem como CSS variables em `src/app/globals.css` e sao expostas no Tailwind por `tailwind.config.ts`.

### Light Mode

```css
--background: 210 40% 98%;
--foreground: 222 47% 11%;
--muted: 210 40% 93%;
--muted-foreground: 215 16% 42%;
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;
--border: 214 32% 86%;
--primary: 199 89% 48%;
--primary-foreground: 0 0% 100%;
--destructive: 346 84% 55%;
--destructive-foreground: 0 0% 100%;
```

### Dark Mode

```css
--background: 222 47% 7%;
--foreground: 210 40% 96%;
--muted: 217 33% 14%;
--muted-foreground: 215 20% 67%;
--card: 222 47% 10%;
--card-foreground: 210 40% 96%;
--border: 217 33% 20%;
--primary: 199 89% 55%;
--primary-foreground: 222 47% 8%;
--destructive: 346 84% 58%;
--destructive-foreground: 0 0% 100%;
```

### Uso Pratico

- Fundo de pagina: `bg-background`, `text-foreground`.
- Superficies: `bg-card/55`, `bg-card/70`, `bg-background/55`.
- Bordas: `border-border`; hover principal `hover:border-sky-400/55` ou `hover:border-sky-400/70`.
- Texto secundario: `text-muted-foreground`.
- Destaque/link/acento: `text-sky-500`, `bg-sky-500`, `border-sky-400/30`.
- Recebivel: `text-emerald-500`, `border-emerald-400/40`.
- Pagavel: `text-amber-500`, `border-amber-400/40`.
- Erro/perigo: `text-rose-500`, `bg-rose-500/10`, `border-rose-400/30`.

## Tipografia

Fonte principal:

```ts
fontFamily: {
  sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
}
```

Padrao de escala:

- Titulo de pagina: `text-2xl font-semibold tracking-tight sm:text-3xl`.
- Titulo de card/secao: `text-lg font-semibold` ou `font-semibold`.
- Titulo de dialog: `text-2xl font-semibold tracking-tight`.
- Corpo: `text-sm`.
- Metadados e detalhes: `text-xs text-muted-foreground`.
- Labels de formulario: `grid gap-2 text-sm font-medium`.

Evite fontes alternativas sem decisao explicita de design system.

## Fundo e Layout

O fundo global combina:

- grid azul com linhas de `56px`;
- halos radiais em azul e emerald;
- camada `body::before` com gradiente azul e `blur(32px)`.

Layout recomendado:

- Paginas autenticadas: `min-h-screen px-4 py-5 sm:px-6 lg:px-8`.
- Container principal: `mx-auto flex w-full max-w-7xl flex-col gap-6`.
- Header: `rounded-xl border border-border bg-card/55 p-4 backdrop-blur-xl`.
- Grids responsivos: `grid gap-4`, com `md:grid-cols-*` e `xl:grid-cols-12` quando houver dashboard modular.

## Cards

Use sempre `Card` de `src/components/ui/card.tsx` como base.

Padrao base:

```tsx
"relative overflow-hidden rounded-lg border border-border bg-card/70 shadow-sm backdrop-blur-xl transition duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:border before:border-sky-400/0 hover:-translate-y-0.5 hover:border-sky-400/55 hover:shadow-glow hover:before:border-sky-300/30";
```

Regras:

- Use padding por contexto: `p-4`, `p-5`, `sm:p-6`.
- Para cards clicaveis, envolva em `button className="text-left"` e mantenha o `Card` interno.
- Use hover do proprio `Card`; nao duplique sombras fortes.
- Para metricas, use icone em `rounded-lg border border-sky-400/30 bg-sky-400/10 p-2`.
- Para listas internas, use superficie mais baixa: `bg-background/45` ou `bg-background/55`.

## Dialogos

Dialogo atual de conta usa overlay customizado.

Overlay:

```tsx
"fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md";
```

Painel:

```tsx
"max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl border border-sky-400/30 bg-background/88 p-5 shadow-[0_0_70px_rgba(14,165,233,.25)] backdrop-blur-2xl animate-float-in";
```

Regras:

- Use `rounded-xl`, blur forte e borda sky transluscida.
- Use `animate-float-in` na entrada.
- Header do dialog: label sky `text-sm text-sky-500` + titulo `text-2xl font-semibold tracking-tight`.
- Footer responsivo: `flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between`.
- Erros: `rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500`.

## Formularios

Inputs, selects e textareas seguem superficie translucida.

Input e Select:

```tsx
"h-11 w-full rounded-lg border border-border bg-background/55 px-3 text-sm outline-none backdrop-blur transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
```

Textarea:

```tsx
"min-h-24 w-full resize-none rounded-lg border border-border bg-background/55 px-3 py-3 text-sm outline-none backdrop-blur transition placeholder:text-muted-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
```

Regras:

- Labels ficam em `grid gap-2 text-sm font-medium`.
- Icones de label usam `inline-flex items-center gap-2`.
- Placeholder deve ser discreto com `placeholder:text-muted-foreground`.
- Foco sempre usa `focus:border-sky-400` e ring sky suave.

## Botoes

Use `Button` de `src/components/ui/button.tsx`.

Base:

```tsx
"inline-flex items-center justify-center gap-2 rounded-lg font-medium outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50";
```

Variantes:

- `primary`: `bg-sky-500 text-white shadow-glow hover:bg-sky-400 hover:shadow-[0_0_38px_rgba(56,189,248,.36)]`.
- `secondary`: `border border-border bg-card/70 text-foreground backdrop-blur hover:border-sky-400/70 hover:text-sky-500`.
- `ghost`: `text-muted-foreground hover:bg-sky-500/10 hover:text-foreground`.
- `danger`: `bg-rose-500 text-white hover:bg-rose-400 hover:shadow-[0_0_28px_rgba(244,63,94,.25)]`.

Tamanhos:

- `sm`: `h-9 px-3 text-sm`.
- `md`: `h-11 px-4 text-sm`.
- `icon`: `h-10 w-10`.

## Badges e Status

Badge base:

```tsx
"inline-flex items-center rounded-full border border-border bg-background/55 px-2.5 py-1 text-xs font-medium text-muted-foreground";
```

Status visual:

- Tipo `receivable`: badge com `border-emerald-400/40 text-emerald-500`.
- Tipo `payable`: badge com `border-amber-400/40 text-amber-500`.
- Categoria: badge neutro base.
- Estado informativo: `border-sky-400/30 bg-sky-500/10 text-sky-500`.
- Estado de erro: `border-rose-400/30 bg-rose-500/10 text-rose-500`.

## Tabelas

Padrao atual:

- Card externo com `overflow-hidden`.
- Header interno: `border-b border-border p-4`.
- Wrapper: `overflow-auto`.
- Tabela: `w-full min-w-[620px] text-sm`.
- Head: `bg-muted/45 text-left text-muted-foreground`.
- Celulas: `px-4 py-3`; valores monetarios alinhados com `text-right`.
- Linhas clicaveis: `cursor-pointer border-t border-border transition hover:bg-sky-500/8`.

## Graficos

Graficos usam Recharts com acento sky.

Padrao visual:

- Container: `Card className="p-4"`.
- Altura: `h-72`.
- Grid: `stroke="currentColor"` com `opacity={0.12}`.
- Tooltip escuro: `background: rgba(15,23,42,.88)`, borda `rgba(56,189,248,.25)` e `borderRadius: 10px`.
- Barras: `fill="#38bdf8"`, `radius={[8, 8, 0, 0]}`.

## Animacoes e Movimento

Tailwind customizado:

```ts
boxShadow: {
  glow: "0 0 32px rgba(56, 189, 248, 0.22)",
}
animation: {
  "border-flow": "borderFlow 2.8s linear infinite",
  "float-in": "floatIn .42s ease both",
  "pulse-line": "pulseLine 3s ease-in-out infinite",
}
```

Uso atual:

- `animate-float-in` para cards de destaque e dialogos.
- `animate-pulse-line` para pontos/linhas de atencao.
- `shadow-glow` para CTAs, icones e hover de cards.
- `transition duration-200` para controles.
- `transition duration-300` para cards.
- Hover de cards com deslocamento pequeno: `hover:-translate-y-0.5`.

Evite animacoes longas, loop intenso ou efeitos que concorram com dados financeiros.

## Dashboard Reorganizavel

Widgets do dashboard seguem grid `xl:grid-cols-12` e usam drag handle proprio.

Padroes:

- Widget wrapper: `group relative min-w-0 rounded-xl transition duration-200`.
- Estado arrastado: `opacity-60`.
- Drop target: `scale-[0.99]`, `ring-2 ring-sky-400/60 ring-offset-2 ring-offset-background`.
- Linha de insercao: `h-2 rounded-full bg-sky-400 shadow-[0_0_22px_rgba(56,189,248,.85)]`.
- Handle: `cursor-grab`, `border-sky-400/30`, `bg-background/80`, `text-sky-500`, `backdrop-blur`, `active:cursor-grabbing`.

## Responsividade

Padroes atuais:

- Login divide tela em desktop com `lg:grid-cols-[1.08fr_.92fr]`; no mobile prioriza formulario.
- Dashboard usa padding progressivo `px-4 sm:px-6 lg:px-8`.
- Header empilha no mobile e vira linha em `sm`.
- Cards de contas usam `md:grid-cols-2`.
- Metricas usam `md:grid-cols-2 xl:grid-cols-4`.
- Tabelas mantem legibilidade com `min-w-[620px]` dentro de `overflow-auto`.

## Checklist Para Novo UI

- Usar tokens semanticos (`bg-background`, `text-foreground`, `border-border`) em vez de cores soltas.
- Usar sky para foco, CTA e interacao primaria.
- Usar `Card`, `Button`, `Input`, `Select`, `Textarea` e `Badge` existentes antes de criar novos primitivos.
- Manter superficies translucidas com `bg-card/70`, `bg-card/55` ou `bg-background/55`.
- Aplicar blur apenas em superficies elevadas ou controles transluzidos.
- Garantir foco visivel com `focus:ring-sky-400`.
- Testar dark e light mode.
- Preservar responsividade mobile antes de adicionar densidade de desktop.

## Evitar

- Cores hardcoded fora de casos ja padronizados, como `#38bdf8` no grafico.
- Cards opacos sem blur quando forem parte do dashboard principal.
- Sombras pretas pesadas; preferir `shadow-sm`, `shadow-glow` e sombras sky transluscidas.
- Bordas muito fortes; preferir opacidades `/30`, `/40`, `/55`, `/70`.
- Animacoes novas sem necessidade clara.
- Componentes duplicados que poderiam compor `src/components/ui/*`.
