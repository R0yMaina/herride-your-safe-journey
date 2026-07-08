# AGENTS.md

## Cursor Cloud specific instructions

### What this is
`HeRide` (a.k.a. HerRide) — a mobile-first, female-only ride-hailing web app. Single
[TanStack Start](https://tanstack.com/start) app (React 19, Vite 7) where each screen is a
file-based route under `src/routes`. It talks to a hosted Supabase project (credentials are
committed in `.env` as `VITE_SUPABASE_*`), so no local database/service needs to be started.

### Package manager
The repo commits both `bun.lock`/`bunfig.toml` and `package-lock.json`. This environment uses
**npm** (Node 22): the update script runs `npm install`. There is no need to install bun.

### Services & commands
Single frontend service. Standard scripts are in `package.json`:
- Dev server: `npm run dev` — Vite serves on a fixed `http://localhost:8080` (port/host are
  pinned by `@lovable.dev/vite-tanstack-config`; don't expect a random port).
- Build: `npm run build` (Nitro/Cloudflare Worker output in `.output`).
- Lint: `npm run lint`. NOTE: the committed source currently fails lint with hundreds of
  pre-existing `prettier/prettier` formatting errors — this is the repo's baseline, not an
  environment problem. `npm run format` (prettier --write) would fix them.

### Non-obvious gotcha: auth is mocked
`src/services/auth/auth.service.ts` is a `MockAuthService`. Sign-up / sign-in / OTP / password
reset all resolve client-side with fake tokens and do NOT hit Supabase. So the sign-up "hello
world" flow succeeds without any real backend or email delivery (it just routes to
`/auth/verify-email`). When wiring real auth later, swap this service — the Supabase client
(`src/integrations/supabase/client.ts`) reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
