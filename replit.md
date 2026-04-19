# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### CyberWatch — Threat Intelligence Dashboard (`artifacts/cyber-threat-dashboard`)
- **Type**: React + Vite (frontend-only served at `/`)
- **Purpose**: Real-world cyber threat intelligence dashboard with world map, live attack feed, news, analytics
- **Pages**: Dashboard (map + stats + feed), Threats (filterable table), Intel Feed (news + CVEs + APT actors), Analytics (charts)
- **Ad Zones**: Top 728×90 banner + 300×250 sidebar (ready for Google AdSense integration)
- **Live data refresh**: All queries auto-refetch every 8–30 seconds
- **Map**: react-simple-maps world map with animated attack arcs

### API Server (`artifacts/api-server`)
- **Type**: Express 5 + TypeScript
- **Database**: PostgreSQL with threat_events, news_articles, threat_actors, cve_entries tables
- **Seeded**: 500 threat events, 10 news articles, 5 threat actors, 5 CVE entries
- **Endpoints**: /api/threats, /api/threats/live, /api/threats/stats, /api/threats/top-attackers, /api/threats/top-targets, /api/threats/by-type, /api/threats/timeline, /api/news, /api/news/trending

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
