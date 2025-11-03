## Copilot / AI agent instructions for APNexus Vision

Short, actionable guidance to make automated edits safe and productive in this repo.

- Project type: Vite + React + TypeScript app with Tailwind and shadcn-ui. Entry: `src/main.tsx` -> `src/App.tsx`.
- Dev commands (from `package.json`):
  - Run dev server: `npm run dev` (Vite, host ::, port 8080)
  - Build: `npm run build` (or `npm run build:dev` for dev-mode build)
  - Lint: `npm run lint` (ESLint)

Important project facts (use these when changing code):

- Routing and layout
  - Routes are declared in `src/App.tsx`. All app pages live in `src/pages/*` and are mounted with the `Layout` wrapper.
  - Add new top-level routes in `src/App.tsx` above the catch-all (`*`) route. Most pages expect to be wrapped with `<Layout>...</Layout>`.
  - The `Layout` component (`src/components/Layout.tsx`) enforces auth (via `useAuth`) and handles mobile vs desktop rendering and sidebar state (persisted to `localStorage` under `sidebar-collapsed`).

- Imports and aliases
  - The repo uses a path alias `@` -> `./src` (see `tsconfig.json` and `vite.config.ts`). Use `@/` imports for files under `src/` (e.g. `import { useAuth } from '@/hooks/useAuth'`).

- Data & state
  - Server data fetching uses React Query (`@tanstack/react-query`). Look for `QueryClient` setup in `src/App.tsx` and follow the project's pattern of short retries and no refetch-on-window-focus.
  - Supabase is the primary backend (see `@supabase/supabase-js` in `package.json` and integrations under `src/integrations/supabase`). Vite PWA runtimeCaching already treats `*.supabase.co` requests specially — be conservative when changing caching strategies.

- UI conventions
  - UI components follow the shadcn-ui pattern in `src/components/ui/*`. Reuse these primitives for consistent styling (e.g., `Button`, `Sheet`, `Avatar` components).
  - Page components live in `src/pages/*`. Small reusable parts go in `src/components/*`.

- Build & runtime notes
  - Dev server binds to all interfaces and runs on port 8080 (Vite config in `vite.config.ts`). If you change dev server options, ensure the hosting and PWA devOptions remain compatible.
  - PWA is enabled (`vite-plugin-pwa`) and configured to auto-update. Runtime caching is configured for Supabase endpoints — altering it can affect offline behavior.

- Conventions & patterns
  - Files use `.tsx` for React components, hooks live in `src/hooks/*`, helpers in `src/lib/*` or `src/utils/*`.
  - Persisted UI state often uses `localStorage` keys directly (example: `sidebar-collapsed` in `Layout`). Search for literal keys when refactoring persistence.
  - Navigation groups are defined inline in `Layout` as `navigationGroups` — changing labels/paths requires careful consideration of routes and breadcrumbs.

- Safety rules for automated edits
  - Never remove or rename routes in `src/App.tsx` without also updating references in `Layout` navigation and any downstream consumers.
  - Preserve `@` alias imports when moving files; update `tsconfig.app.json` only if updating project-wide path rules.
  - When touching auth flows, prefer small focused changes. `useAuth` and `AuthProvider` are central; breakage here causes the app to redirect to `/auth`.
  - For runtime caching and PWA changes, mention the impact on offline behavior in the PR description.

- Small examples
  - Add route: in `src/App.tsx` add `import MyPage from '@/pages/MyPage'` and add a route: `<Route path="/my-page" element={<Layout><MyPage /></Layout>} />` above the `*` route.
  - Use React Query: create hooks under `src/hooks` that call `useQuery`/`useMutation` and place fetch logic in `src/integrations/supabase` or `src/lib/utils.ts`.

If anything in this file is unclear or you want more detail about a specific area (PWA, auth, routing, or a directory), tell me which part to expand and I will iterate.
