# Portfolio site — design spec

**Domain:** barborka.party
**Owner:** Barbora Hulová ([github.com/MissLittleBee](https://github.com/MissLittleBee))
**Date:** 2026-05-15

## 1. Goal

Replace the existing Wix site (`barborahulova.wixsite.com/barborahulova`) with a self-hosted personal CV / portfolio served from `barborka.party`. The site doubles as a public skill demo: TypeScript, Astro, CI/CD on GitHub Actions, Cloudflare Pages deploy.

## 2. Locked decisions

| Decision | Value | Why |
|---|---|---|
| Framework | **Astro + TypeScript** | TS-native, ships near-zero JS, ideal for content-heavy single-page CV. |
| Hosting | **Cloudflare Pages** | Domain already on Cloudflare, free TLS, fast global edge. |
| Deploy | **GitHub Actions → Cloudflare Pages** | Visible CI/CD on profile; type-check + lint gates before deploy. |
| Repo visibility | **Public** | The repo *is* part of the showcase; unlimited Actions minutes. |
| Language | **English only** | Recruiter audience; avoids dual content maintenance. |
| Sections | `#about_me`, `#career`, `#my_work`, `#contact` | Hashtag prefix is a deliberate stylistic choice (terminal/dev feel). |
| Scrolling | **Smooth scroll + `IntersectionObserver` reveal** | Modern, accessible, no heavy JS. |
| Palette | **Dark, Solaax-inspired** (see §5) | User reference: `Solax-Green-Websites-Examples-1.jpg`. |
| `#my_work` data | **GitHub API at build time, filter by `portfolio` topic** | User curates by tagging repos; no runtime API calls. |
| `#contact` | **Static links: email, LinkedIn, GitHub** + **CV.pdf download** | Zero backend; spam-free. |
| `#career` layout | **Vertical timeline** with green active node | Scannable narrative; animates well on reveal. |

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub repo (MissLittleBee/barborka-party)                     │
│  ├─ src/                  ← Astro project (TS)                  │
│  ├─ public/               ← static assets, cv.pdf, og images    │
│  ├─ .github/workflows/    ← deploy.yml: build + deploy to CF    │
│  └─ astro.config.mjs                                            │
└─────────────────────────────────────────────────────────────────┘
              │ push to main
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions                                                 │
│  1. checkout                                                    │
│  2. setup-node + npm ci                                         │
│  3. tsc --noEmit + eslint                                       │
│  4. npm run build  ← Astro fetches GitHub API for #my_work      │
│     (uses GH_TOKEN, filters by topic=portfolio)                 │
│  5. cloudflare/pages-action → push dist/ to CF Pages            │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages  →  serves dist/ at barborka.party            │
│  Cloudflare DNS    →  CNAME barborka.party + www auto-managed   │
└─────────────────────────────────────────────────────────────────┘
```

**Build-time fetch trade-off:** Visitors get instant static HTML; no API call at page load, no rate-limit risk, no client spinner. Cost: repo list refreshes only on deploy. Acceptable for a CV. A nightly GitHub Actions cron can refresh later if needed.

## 4. Project structure

```
barborka-party/
├─ src/
│  ├─ pages/
│  │  └─ index.astro              ← single-page app, all 4 sections
│  ├─ components/
│  │  ├─ Nav.astro                ← sticky top nav, # anchor links
│  │  ├─ Hero.astro               ← #about_me + code card
│  │  ├─ Timeline.astro           ← #career, vertical line + nodes
│  │  ├─ RepoGrid.astro           ← #my_work, cards from GitHub data
│  │  ├─ RepoCard.astro           ← single repo card
│  │  ├─ Contact.astro            ← #contact, links + CV button
│  │  └─ Reveal.astro             ← IntersectionObserver wrapper
│  ├─ lib/
│  │  ├─ github.ts                ← typed fetch + filter logic
│  │  └─ career.ts                ← career data (typed array)
│  ├─ styles/
│  │  └─ global.css               ← CSS vars for palette, base resets
│  ├─ scripts/
│  │  └─ reveal.ts                ← IntersectionObserver script (~30 lines)
│  └─ content/
│     └─ about.md                 ← bio text, easy to edit
├─ public/
│  ├─ cv.pdf
│  ├─ favicon.svg
│  └─ og-image.png
├─ tests/
│  └─ github.test.ts              ← Vitest, mocks GitHub API
├─ .github/workflows/deploy.yml
├─ astro.config.mjs
├─ tsconfig.json
├─ package.json
└─ README.md
```

**Boundaries:**
- `lib/github.ts` is independently testable — mock fetch, assert filter and sort.
- `Reveal.astro` wraps any child; reveal logic is not duplicated.
- `career.ts` is plain typed data; edit without touching components.
- `about.md` lets bio change without code edits.

## 5. Visual design

### Palette (dark, Solaax-inspired)

| Token | Hex | Use |
|---|---|---|
| `--surface` | `#040a07` | Page background |
| `--panel` | `#0a1f15` | Floating hero panel, cards |
| `--panel-edge` | `rgba(28,231,131,0.08)` | 1px borders |
| `--accent` | `#1ce783` | Section labels (`# about_me`), CTAs, timeline active node |
| `--accent-dim` | `#6ee7b7` | Code comments, secondary accents |
| `--heading` | `#ffffff` | H1–H3 |
| `--body` | `#a8bab1` | Paragraphs, metadata |

### Typography
- **Sans:** Inter (self-hosted via `@fontsource/inter`)
- **Mono:** JetBrains Mono (self-hosted via `@fontsource/jetbrains-mono`)
- **Section headers:** mono, accent color, prefixed `# section_name`

### Hero treatment
Floating rounded panel (`border-radius: 20px`) on dark surface. Inner radial gradient adds subtle highlight from top-right. Two-column grid: left = headline + bio + CTA pill (white background, dark text, `»` arrow). Right = code-snippet card with a class definition of "Barbora" (`role`, `stack`, `curious_about`, `build()` method).

### Scrolling & motion
- CSS `scroll-behavior: smooth` on `<html>`.
- `IntersectionObserver` toggles `.in-view` class at 20% visibility; CSS handles the fade-up.
- `prefers-reduced-motion: reduce` disables both.

## 6. Data flow

### GitHub fetch (`src/lib/github.ts`)

```ts
type Repo = {
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
  updated_at: string      // ISO
  topics: string[]
}

export async function fetchPortfolioRepos(): Promise<Repo[]> {
  const res = await fetch(
    'https://api.github.com/users/MissLittleBee/repos?per_page=100',
    { headers: { Authorization: `Bearer ${import.meta.env.GH_TOKEN}` } }
  )
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const all = (await res.json()) as Repo[]
  return all
    .filter(r => r.topics.includes('portfolio'))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
}
```

`RepoGrid.astro` calls `fetchPortfolioRepos()` in its frontmatter (server-side at build). Result is baked into HTML.

### Career data (`src/lib/career.ts`)

```ts
export type CareerEntry = {
  role: string
  company: string
  start: string   // 'YYYY-MM'
  end: string | 'present'
  bullets: string[]
  stack: string[]
}
export const career: CareerEntry[] = [/* filled in by user */]
```

### Secrets

| Secret | Scope | Stored in |
|---|---|---|
| `GH_TOKEN` | Fine-grained PAT, public-repo read only | GitHub Actions secrets |
| `CF_API_TOKEN` | Pages → Edit + Account → Read | GitHub Actions secrets |
| `CF_ACCOUNT_ID` | Cloudflare account ID (not secret, but configured here) | GitHub Actions secrets |

PAT raises rate limit from 60/h to 5000/h. Token never reaches client bundle (build-time only).

## 7. Deploy pipeline

`.github/workflows/deploy.yml` (sketch):

```yaml
name: deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions: { contents: read, deployments: write }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
      - uses: cloudflare/pages-action@v1
        with:
          apiToken:    ${{ secrets.CF_API_TOKEN }}
          accountId:   ${{ secrets.CF_ACCOUNT_ID }}
          projectName: barborka-party
          directory:   dist
          branch:      main
```

### DNS / domain attach
1. Create Cloudflare Pages project named `barborka-party`.
2. After first successful deploy, attach custom domain → Cloudflare auto-creates the CNAME for `barborka.party` and `www.barborka.party`.
3. TLS issued and renewed automatically.

## 8. Testing & verification

**Unit tests (Vitest):** `tests/github.test.ts`
- Returns only repos with `portfolio` topic.
- Sorts by `updated_at` descending.
- Throws on non-2xx response.

**Type check:** `tsc --noEmit` runs in CI before build.

**Visual smoke check (manual, every deploy):**
1. Site loads on `barborka.party` with valid TLS.
2. All four `#anchor` links scroll to right section smoothly.
3. Repo cards render with real GitHub data; links open in new tab.
4. CV.pdf downloads.
5. Lighthouse: Performance ≥ 95, Accessibility ≥ 95.
6. `prefers-reduced-motion: reduce` honoured (reveals static).

**Not included:** E2E / Playwright — overkill for a static CV.

## 9. Build milestones

1. Bootstrap Astro+TS, add palette CSS vars, deploy "Hello world" to `barborka.party` end-to-end. *Proves the pipeline before feature work.*
2. Build `Nav` + `Hero` (`#about_me` with code card).
3. Build `Timeline` (`career.ts` data + component).
4. Build `lib/github.ts` + unit tests + `RepoGrid` / `RepoCard`.
5. Build `Contact` + CV.pdf.
6. Add `Reveal.astro` + scroll polish.
7. Lighthouse pass, accessibility pass, SEO + OpenGraph meta tags.

## 10. Out of scope

- Blog / writing section
- Dark/light mode toggle (site is dark-only by design)
- Bilingual EN/CZ
- Contact form (backend, spam surface)
- Comments, analytics, newsletter signup
- Server-side rendering, edge functions
- E2E browser tests
- CMS for content (user edits `.md` and `.ts` directly)

Each future feature adds a working part that needs maintenance. Ship the spine first; revisit only after live-site feedback.

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Token committed accidentally | Use GitHub Actions secrets; `.env*` in `.gitignore`; rotate if leaked. |
| GitHub API rate-limit on repeat builds | PAT auth (5000/h) plus build-time-only fetch. |
| CV.pdf contains sensitive data | Strip full address, national ID, phone; keep email + city only. |
| Build fails on production deploy | Type-check, lint, and tests gate the deploy job. |
| Cloudflare Pages outage | Acceptable for a personal site; no SLA needed. |
