# Graph Report - /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash  (2026-04-24)

## Corpus Check
- 30 files · ~18,839 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 93 nodes · 130 edges · 28 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]

## God Nodes (most connected - your core abstractions)
1. `databaseErrorMessage()` - 11 edges
2. `Select()` - 11 edges
3. `firstError()` - 10 edges
4. `formString()` - 9 edges
5. `createAccountAction()` - 8 edges
6. `updateAccountAction()` - 8 edges
7. `getSession()` - 8 edges
8. `updateAdminUserAction()` - 7 edges
9. `assertAccountLimit()` - 6 edges
10. `loginAction()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `updateUserFormAction()` --calls--> `updateAdminUserAction()`  [INFERRED]
  /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/admin/page.tsx → /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/actions.ts
- `updateTenantFormAction()` --calls--> `updateAdminTenantAction()`  [INFERRED]
  /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/admin/page.tsx → /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/actions.ts
- `getAccessibleAccount()` --calls--> `Select()`  [INFERRED]
  /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/actions.ts → /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/components/ui/select.tsx
- `requireAdminSession()` --calls--> `getSession()`  [INFERRED]
  /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/actions.ts → /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/lib/auth.ts
- `loginAction()` --calls--> `Select()`  [INFERRED]
  /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/app/actions.ts → /Users/carlosroberto/Workspace/Projetos/fullstack/flowcash/src/components/ui/select.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.3
Nodes (17): accountPayload(), createAccountAction(), databaseErrorMessage(), firstError(), formString(), importCsvAction(), loginAction(), normalizeEmails() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (8): canAccess(), getAccessibleAccount(), logoutAction(), softDeleteAccountAction(), destroySession(), getCurrentUser(), getSession(), LoginPage()

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (5): accountTypeCount(), assertAccountLimit(), tenantQuota(), main(), Select()

### Community 4 - "Community 4"
Cohesion: 0.6
Nodes (3): normalizeDashboardLayout(), parseDashboardLayout(), reorderDashboardLayout()

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (2): updateTenantFormAction(), updateUserFormAction()

### Community 6 - "Community 6"
Cohesion: 0.5
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): addEnumValue(), main()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 9`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `cn()`, `auth-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `toggleTheme()`, `theme-toggle.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `Card()`, `card.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Button()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (2 nodes): `Textarea()`, `textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `drizzle.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `validators.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `dashboard-layout.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `schema.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Select()` connect `Community 3` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `getSession()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `updateAdminUserAction()` connect `Community 0` to `Community 3`, `Community 5`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `Select()` (e.g. with `getAccessibleAccount()` and `tenantQuota()`) actually correct?**
  _`Select()` has 10 INFERRED edges - model-reasoned connections that need verification._