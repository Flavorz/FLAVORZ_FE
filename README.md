# Flavorz — white-label front end

A single Astro + React front end that serves many brands. One build, one
bundle, one set of static files; each brand is a config record plus a small
generated CSS file.

Built on [Astryx](https://astryx.atmeta.com/), Meta's open-source React design
system (150+ accessible components, themed entirely through CSS custom
properties).

---

## How white-labeling works

A brand is **data**, not a build target.

```
config/tenants/<id>.json      the brand: accent, neutral tone, radius, copy, assets
        │
        │  scripts/build-tenant-themes.mjs   (seconds, no app rebuild)
        ▼
src/generated/themes/<id>.js   compiled Astryx theme (bundled, used by islands)
public/themes/<id>.css         compiled token CSS (served, linked in <head>)
```

At runtime:

1. `BaseLayout.astro` emits a `<link>` for every tenant stylesheet. All but one
   are parked at `media="print"` so they do not block rendering.
2. A **blocking inline script** in `<head>` resolves `window.location.hostname`
   to a tenant, sets `data-astryx-theme` on `<html>`, and promotes that
   tenant's stylesheet to `media="all"` — all before first paint, so there is
   no flash of the wrong brand.
3. React islands read the resolved tenant and wrap themselves in Astryx's
   `<Theme>` with that tenant's compiled theme object.

Astryx scopes every generated token to `[data-astryx-theme="<id>"]`, so setting
that one attribute is what activates a brand.

### Why one accent is usually enough

`defineTheme`'s `color` axis expands a single accent seed into the full
palette — surfaces, text, icons, borders, hover and pressed overlays, in both
light and dark — and guarantees **≥ 4.5:1** contrast for generated text. A
brand supplies one hex value and gets a complete, accessible theme.

Astryx may adjust the seed to meet that guarantee (`#D6452B` → `#B52613`).
That is the accessibility machinery working, not a bug.

> **Not derived from the accent:** status colors (success / warning / error)
> and the categorical data-viz hues. They keep framework defaults tuned for
> the default surfaces. A brand with an unusual palette should set them
> explicitly in `theme.tokens` and check both modes.

---

## Quick start

```bash
pnpm install
pnpm run build:all     # compile tenant themes, then build the site
pnpm run dev           # http://localhost:4321
```

Preview any brand without owning its hostname:

```
/preview/flavorz/
/preview/verdant/
```

---

## Adding a brand

```bash
node scripts/add-tenant.mjs \
  --id acme --name "Acme Bistro" \
  --host acme.example.com \
  --accent "#6B4EFF" --neutral-style cool --radius sharp
```

This writes `config/tenants/acme.json`, creates `public/brands/acme/`, and
compiles `public/themes/acme.css`. **The app is not rebuilt.** Upload the one
CSS file and point the hostname at the distribution.

Then drop in `public/brands/acme/logo.svg` and `favicon.svg`.

---

## Content and the API seam

No screen hardcodes content. Copy, prices and imagery metadata live in
`src/content/*.json` and are read through `src/lib/data/`:

```ts
import { content } from '../lib/data';
const home = await content.home();
```

Switching to a real backend is an environment change, not a code change:

```bash
PUBLIC_CONTENT_SOURCE=api
PUBLIC_API_BASE_URL=https://api.theflavorz.com/v1
```

`src/lib/data/types.ts` is the contract both sources satisfy, and
`tests/data-source.test.ts` enforces it — including that no product, cart line
or home reference points at a missing maker or product. See
[src/content/README.md](src/content/README.md) for the endpoint list.

Routes come from the data too: adding a product to `products.json` generates
its page.

---

## Pulling tokens from Figma

`scripts/figma-pull.mjs` reads a Figma file and maps its colour tokens onto a
tenant's theme.

```bash
cp .env.example .env          # then fill in FIGMA_TOKEN and FIGMA_FILE_KEY

node scripts/figma-pull.mjs --inspect              # what does the file have?
node scripts/figma-pull.mjs --tenant flavorz --dry # preview the change
node scripts/figma-pull.mjs --tenant flavorz       # write it
pnpm run theme:build                               # recompile
```

It tries **Figma Variables** first — typed variables with modes, so Light/Dark
map straight onto our `[light, dark]` pairs. That endpoint is gated to Figma
Org/Enterprise plans; on Professional it returns 403 and the script falls back
to **published styles**, which work on any plan but carry no mode information.

The accent is chosen by name: a variable matching `accent`, `brand` or
`primary` wins. Override with `--accent-name "<exact name>"`.

> **The token grants read access to every file in your Figma account.** It
> lives only in `.env`, which is gitignored. Never commit it, and never paste
> it into a chat or an issue.

---

## Moving brand config to the backend

Today tenants are JSON files compiled into the bundle. The contract is already
defined and validated in [`src/lib/tenant/schema.ts`](src/lib/tenant/schema.ts);
the backend needs to serve exactly that shape.

When the API exists:

1. Serve `GET /tenant-config?host=<hostname>` returning a `TenantConfig`.
2. Switch the source in [`src/lib/tenant/resolve.ts`](src/lib/tenant/resolve.ts)
   — `fetchTenantFromApi()` is already written and typed.
3. Compile themes from API data instead of local files:
   `node scripts/build-tenant-themes.mjs --from <dir>`.

**Keep the inline resolver synchronous.** Fetching the tenant before first
paint would paint unbranded first. Consult the API *after* paint to refresh a
cached value.

**Never put secrets in tenant config** — it ships to the browser. Public keys
and base URLs only.

---

## The component library

Blocks in `src/components/react/blocks/` are thin compositions of Astryx
primitives. None of them names a brand: logo, copy, colour, type and motion all
resolve from the tenant.

| Block | Purpose |
| --- | --- |
| `SiteHeader` | Brand mark, nav, primary CTA |
| `HeroBlock` | Headline with staggered entrance |
| `FeatureGrid` | Responsive card grid, reflows on width |
| `SiteFooter` | Legal line and support contact |
| `TokenSwatches` | Live token documentation |

### App surface

`src/components/react/app/` holds the interactive, authenticated blocks.

| Block | Purpose |
| --- | --- |
| `AppShell` | Collapsible side nav, header, content slot |
| `DataTable` | Sortable + selectable table with a selection toolbar |
| `FormPanel` | Validated form; errors on blur and submit |

Demo at `/app/<tenant>/`.

Two Astryx details worth knowing:

- **Table columns opt IN to sorting** with `sortable: true`. The
  `useTableSortable` plugin alone renders no sort control and no `aria-sort` —
  the table looks correct and silently does nothing.
- **`IconButton.icon` takes a ReactNode** (`<Icon icon="menu" />`), while
  `SideNavItem.icon` takes a name string (`icon="calendar"`). Passing a string
  to `IconButton` renders the literal word.

### Living documentation

`/design/<tenant>/` renders every block under that brand — the same components,
re-skinned. Because it renders the real implementation it cannot drift from the
code the way a written spec does.

```
/design/flavorz/     serif, warm, soft corners
/design/verdant/     sans, cool, pill buttons
```

### House rules

From `.claude/CLAUDE.md`, and worth repeating because breaking the first one
cost a real bug:

- **No raw `<div>` for layout.** A bare `div` wrapping a `Section` gave it no
  layout context and the preview collapsed to 2px. Use `Card`, `Section`,
  `Stack` or `Grid`.
- **No raw hex or px.** Style through component props first, then tokens
  (`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`).
- **Read the component before using it.** `astryx component <Name>` — the props
  are not guessable (`Text` uses `type`, not `variant`; `Badge` has `neutral`,
  not `gray`; `Stack` direction is `horizontal`, not `row`).

---

## Layout

```
config/tenants/        brand records (the white-label input)
scripts/
  build-tenant-themes.mjs   JSON -> Astryx theme CSS + JS
  add-tenant.mjs            scaffold one brand
  deploy-s3.sh              upload with per-class cache headers
src/
  layouts/BaseLayout.astro  tenant resolution + no-flash theming
  lib/tenant/               schema (Zod), hostname resolver, island context
  components/react/         React islands (Astryx + Motion)
    blocks/                 brand-agnostic building blocks
  generated/themes/         compiled per-tenant themes (generated)
  pages/                    routes, incl. /preview/[tenant]
tests/                      unit (vitest) + e2e (playwright)
```

---

## Commands

| Command | What it does |
| --- | --- |
| `pnpm run dev` | Dev server |
| `pnpm run build:all` | Tenant themes, then the site |
| `pnpm run theme:build` | Recompile tenant themes only |
| `pnpm run theme:check` | Fail if compiled themes are stale (CI) |
| `pnpm run test` | Unit tests |
| `pnpm run test:e2e` | Browser tests against the real build |
| `pnpm run check` | Astro + TypeScript typecheck |

---

## Deployment

`scripts/deploy-s3.sh <bucket>` uploads `dist/` with cache headers per file
class:

| Path | Cache-Control | Why |
| --- | --- | --- |
| `_astro/*` | `max-age=31536000, immutable` | content-hashed by Astro |
| `themes/*.css` | `max-age=300, must-revalidate` | **not** hashed; a brand tweak must go live without a redeploy |
| `*.html` | `max-age=0, must-revalidate` | entry points |

> **Infrastructure is not provisioned by this repo.** The bucket, CloudFront
> distribution, certificates and DNS still need to be created, and
> `.github/workflows/deploy.yml` expects `AWS_DEPLOY_ROLE_ARN`, `S3_BUCKET`
> and `CLOUDFRONT_DISTRIBUTION_ID` to be set. The workflow uses OIDC rather
> than long-lived AWS keys.

---

## Working with Astryx

`.claude/CLAUDE.md` holds Astryx's agent instructions, so AI tools generate
correct component code.

```bash
pnpm exec astryx component Button     # exact props for one component
pnpm exec astryx search <query>       # find components, docs, templates
pnpm exec astryx docs tokens          # every design token
```

Two sharp edges worth knowing:

- **`defineTheme` ignores unknown keys silently.** The generative color axis is
  `color`, not `colorScale`. Getting it wrong builds successfully and produces
  the *default* palette. `tests/theme-build.test.ts` guards against this.
- **`<Theme>` writes `data-astryx-theme` from `theme.name`.** Passing the base
  theme to an island makes that island resolve base tokens even when `<html>`
  says otherwise. Always pass the tenant's own compiled theme.
