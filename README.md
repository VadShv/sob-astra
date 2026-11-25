# Sobesso — ATS Clone

HR/ATS platform clone of [app.sobesso.ru](https://app.sobesso.ru), built with Next.js 15, Ant Design 5, React Query 5, and TypeScript.

## Stack

- **Next.js 15** (App Router, RSC, middleware auth guard)
- **Ant Design 5** (CSS var mode, ru_RU locale, dark theme)
- **TanStack React Query 5** (server state, cache, optimistic UI)
- **Axios** (API client with 401 interceptor)
- **TypeScript** (strict mode)
- **Bun** (package manager)

## Architecture

```
src/
  app/
    (only-not-auth)/login/    — login page (password, magic link, 2FA, HH)
    (auth)/                   — authenticated routes
      home/                   — dashboard (vacancies, KPI)
      search/                 — candidate search (filters, AI, saved searches)
      messages/               — conversations (tabs, polling)
      analytics/              — hiring analytics (KPI, funnels, export)
      vacancy/[id]/           — vacancy detail (funnel, candidates)
      vacancy/new/            — create/edit vacancy
      candidate/[id]/         — candidate profile (resume, tags, notes)
      candidate/new/          — create candidate
      settings/*/             — 9 settings sub-pages
    proxy/[...path]/          — API proxy to api.sobesso.ru
  components/                 — Sidebar, AppShell, PageHeader, SettingsLayout
  lib/
    api.ts                    — 50+ API methods, typed interfaces
    theme.ts                  — base/dark/login themes
    format.ts                 — date/currency/percent formatters
    query-keys.ts             — centralized query key factory
```

## API Proxy

All API requests go through `/proxy/[...path]` which forwards to `api.sobesso.ru` with cookie rewriting (Domain stripped, SameSite=Lax). This allows cookie-based auth to work on localhost.

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build (includes type check + lint) |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run typecheck` | TypeScript type check |

## Features

- Login: password, magic link, 2FA OTP, HeadHunter OAuth
- Dashboard: vacancies table, KPI, bulk actions, org units
- Search: candidate table, filters, AI search, saved searches, export
- Messages: conversations with real-time polling, reply
- Analytics: KPI, source breakdown, rejection reasons, team funnels, export
- Vacancy: funnel stages, candidate management, status changes
- Candidate: profile, resume upload, tags, notes, add to vacancy
- Settings: account, company, notifications, appearance, roles, templates, users, funnels, integrations
- Dark mode with system preference detection
- Keyboard navigation and ARIA labels
- Centralized error handling with toast notifications
