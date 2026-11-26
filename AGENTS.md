# AGENTS.md

## Project

Sobesso ATS clone — Next.js 15 + Ant Design 5 + React Query 5 + TypeScript.

## Commands

- **Install:** `bun install`
- **Dev:** `bun run dev`
- **Build:** `bun run build` (includes type check + lint)
- **Type check:** `bun run typecheck`
- **Lint:** `bun run lint`
- **Unit tests:** `bun run test` (vitest, 70 tests)
- **E2E tests:** `bun run test:e2e` (Playwright, requires `bun run test:e2e:install` first)

Always run `bun run build` after changes to verify types and lint pass.

## Architecture

- API proxy at `/proxy/[...path]` forwards to `api.sobesso.ru` with cookie rewriting
- API client in `src/lib/api.ts` uses relative URLs (`baseURL: /proxy`) for cookie auth
- Query keys centralized in `src/lib/query-keys.ts` — use `qk.*` factory, never inline strings
- Theme in `src/lib/theme.ts` — `baseTheme`, `darkTheme`, `loginTheme`
- Format helpers in `src/lib/format.ts` — date, currency, percent, greeting, initials
- `usePageTitle` hook in `src/components/usePageTitle.ts` for per-page document titles

## Conventions

- Russian UI text (locale ru_RU)
- No `any` types, no `@ts-ignore`, no `console.log` in production code
- All `useQuery` calls use the `qk` factory for query keys
- All `useMutation` calls have `onError` handlers with `message.error()`
- Reference data queries use `staleTime: 300_000` (5 min)
- Paginated queries use `placeholderData: keepPreviousData`
- Filterable queries forward `signal` to API for request cancellation
- CSS modules for page-specific styles, antd tokens for theme
- Route groups: `(auth)` for authenticated, `(only-not-auth)` for login

## Theme

- Primary: `#6B53D5`
- Ink: `#151716`
- Border radius: 16px
- CSS var mode enabled
- Dark mode via `ThemeProvider` with localStorage persistence

## Auth

- Cookie: `sobessoSession` (JWT)
- Middleware checks cookie, redirects to `/login` if missing
- Axios 401 interceptor redirects to `/login`
- Global `QueryCache.onError` shows toast for initial-load failures
