## Development

Always base the visual and UX design on `DESIGN.md` when building or modifying UI.

### Data rules (no hardcoded values)

No component may contain hardcoded business data, fallbacks, or magic strings (e.g. inline prices, names, statuses, defaults, IDs). Follow three categories:

1. **Business data** (prices, names, statuses, catalog rows, defaults, IDs): must come from the database. If the data is not available from the database, the UI must render the real stored value or an empty/neutral state — never a fabricated fallback.
2. **Infrastructure credentials** (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, AWS/S3 keys): must be read from environment variables only, never hardcoded in source. See Environment & Secrets.
3. **Store configuration** (e.g. `STORE_DEFAULT_LOCATION`, currency, tax): belongs in the database (`site_settings`) or a documented config module, not scattered as inline values.

**Known security bugs to fix (separate task, then rotate credentials):** hardcoded credentials in `src/db/client.ts`, `drizzle.config.ts`, `src/utils/jwt.ts` (JWT secret), `src/pages/api/auth/login.ts` (default passwords), and `NEON_API_BASE_URL` in `src/utils/imageUrl.ts`.

### Language

The storefront, API responses, console messages, and admin UI are written in Spanish (es-CO). All user-facing text must be Spanish. Currency is Colombian pesos (COP) and dates are formatted es-CO (`formatCurrency`, `formatDate` in `src/utils/`).

## Commands & Verification

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

| Command | Purpose |
| :------ | :------ |
| `npm run dev` | Dev server (default foreground) |
| `astro dev --background` | Background dev server (preferred) |
| `npm run check` | Type + Astro diagnostics (`astro check`) |
| `npm run build` | Production build to `./dist/` (also runs in Docker) |
| `npm run preview` | Preview the production build |
| `npm run db:push` | Push Drizzle schema to Neon |
| `npm run db:studio` | Drizzle Studio UI |

Before finishing a task, run `npm run check`; if the change affects runtime behavior or build output, also run `npm run build`.

## Architecture & Project Structure

The storefront is an SPA mounted inside Astro SSR pages:

- `src/pages/index.astro` and `src/pages/[...slug].astro` only mount `<App client:only="react" />` — the whole storefront is one React root.
- `src/App.tsx` is the SPA root: global state, client-side routing via `history.pushState`, and a "tab" view switcher (`activeTab` + `navigateToTab()`).
- **New storefront views are tabs in `App.tsx`, not new `.astro` pages**: add a tab value to `activeTab`, a route branch in `navigateToTab()`, and a render branch in the main `<main>` section. Paths map in `handleLocationChange()`.
- Admin is an exception: `src/pages/admin/[...section].astro` mounts `AdminDashboard` for its own section-based routing.

### Data flow

```
DB (Drizzle + Neon)  →  src/pages/api/*.ts endpoints  →  src/services/api.ts  →  React components
```

- `src/db/schema.ts`: Drizzle schema (17 3NF-normalized tables).
- `src/db/client.ts`: DB client (also `getDb()`).
- `src/db/writers.ts`: upsert/format helpers for mutations (needs parity with schema).
- `src/data/*`: curated bootstrap/import datasets (not the runtime source of truth).
- `src/utils/*`: pure helpers (jwt, password, auth, config, formatCurrency, formatDate, imageUrl, taxCalculator, whatsapp, orderNotes, returnNotes).
- `src/components/admin/*`: admin CRUD managers.

## API & Database Conventions

- Endpoints are REST-style, one per resource in `src/pages/api/*.ts`, exporting `GET`/`POST`/`PUT`/`DELETE` handlers as `APIRoute`.
- Response envelope is always `{ success: boolean, data? , error? }` with `Content-Type: application/json`. Error messages in Spanish.
- Mutations use the upsert helpers in `src/db/writers.ts`; verify the helper matches the schema's normalized tables (e.g. `partOemNumbers`, `modelYears`).
- Do not call the DB directly from React components — go through the API endpoints and `src/services/api.ts`.
- Run Drizzle checks after schema change: `npm run db:push`.

## Component IDs

Every singleton React component in `src/components/` (rendered at most once per view) must have a kebab-case `id` on its root element, derived from the filename (`ProductDetailModal.tsx` → `product-detail-modal`). This lets the AI (or a browser tool) locate a component by id: `document.getElementById('cart-drawer')` or open the matching source file.

Rules:

- Singleton components: `id` on the root element, always in kebab-case.
- Components rendered in lists/maps (e.g. `ProductCard`, `UserAvatar`, `ProductImageFallback`, skeleton cards): no static `id` (it would duplicate in the DOM). Identify them via their singleton container instead.
- When a component returns a fragment (`<>`), wrap it in a single root `<div>` carrying the id.
- Multi-branch returns (e.g. empty/loading/success states): every branch's root gets the same id.
- Components without a visible root (logic-only wrappers) are exempt.

## Seeding & Data

- `npm run db:push` creates/alters tables; it does not seed data.
- The seed dataset lives in `drizzle/seed_all_13_tables.sql` (applied manually) and `src/pages/api/seed.ts` (an API endpoint).
- Deposited/imported data: `src/data/*` are bootstrap/import sources, not the runtime source of truth. Prefer updating via admin UI or seed rather than editing these files for live changes.

## Environment & Secrets

Required variables (see `.env.example` for the full list and comments):

- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — HS256 secret for auth tokens
- `GEMINI_API_KEY` — Google Gemini key for the AI assistant
- `PUBLIC_SHOW_PRODUCT_IMAGES` — `false` to hide product images
- `NEON_REST_API_URL` — Neon REST base for image URLs
- `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — S3-compatible storage

Rules:

- Never hardcode credentials in source; read them from env vars (see Data rules).
- Never commit real secrets; keep `.env` gitignored and put placeholders in `.env.example`.
- When adding a new env var, update `.env.example`.

## Git & Commits

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), Spanish-friendly subject lines.
- Match the existing style seen in the log (e.g. `feat: implement ...`, `refactor(parts): ...`).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)