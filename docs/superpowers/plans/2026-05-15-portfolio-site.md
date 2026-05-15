# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy `barborka.party` — a single-page personal CV site in Astro + TypeScript, with a build-time GitHub repo feed, deployed via GitHub Actions to Cloudflare Pages.

**Architecture:** Astro project (static output), TypeScript, plain CSS with custom properties, build-time GitHub API fetch filtered by `portfolio` topic, IntersectionObserver-based reveal animations. GitHub Actions runs type-check → lint → test → build → deploy on every push to `main`.

**Tech Stack:** Astro 4+, TypeScript 5+, Vitest, ESLint, `@fontsource/inter`, `@fontsource/jetbrains-mono`, GitHub Actions, `cloudflare/pages-action@v1`.

**Prerequisites — do these before Task 1:**
1. Node 22 LTS installed: `node --version` shows `v22.x` (Astro 6 requires ≥ 22.12.0).
2. Empty GitHub repo `MissLittleBee/barbora-cv` exists (public).
3. Cloudflare Pages project named `barbora-cv` exists (Pages, not Worker — confirmed during setup).
4. GitHub Actions secrets configured on the repo (Settings → Secrets and variables → Actions):
   - `GH_TOKEN` — fine-grained PAT, scope: public repos, read-only metadata.
   - `CF_API_TOKEN` — Cloudflare API token with permission `Account → Cloudflare Pages → Edit`.
   - `CF_ACCOUNT_ID` — copy from Cloudflare dashboard right sidebar.

---

## File structure (final state)

```
barborka-party/
├─ .github/workflows/deploy.yml
├─ .gitignore
├─ astro.config.mjs
├─ tsconfig.json
├─ package.json
├─ vitest.config.ts
├─ .eslintrc.cjs
├─ README.md
├─ public/
│  ├─ cv.pdf
│  ├─ favicon.svg
│  └─ og-image.png
├─ src/
│  ├─ pages/index.astro
│  ├─ layouts/Base.astro
│  ├─ components/
│  │  ├─ Nav.astro
│  │  ├─ Hero.astro
│  │  ├─ Timeline.astro
│  │  ├─ RepoGrid.astro
│  │  ├─ RepoCard.astro
│  │  ├─ Contact.astro
│  │  └─ Reveal.astro
│  ├─ lib/
│  │  ├─ github.ts
│  │  └─ career.ts
│  ├─ styles/global.css
│  ├─ scripts/reveal.ts
│  └─ content/about.md
└─ tests/
   └─ github.test.ts
```

Each task below produces a working, committed state. Run `git log --oneline` after each commit to verify.

---

## Task 1: Bootstrap Astro + TypeScript project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `README.md`

- [ ] **Step 1: Initialize npm project**

Run from `/Users/barbora.hulova/repos/barborka-party`:
```bash
npm init -y
```
Expected: creates a default `package.json`.

- [ ] **Step 2: Install Astro and TypeScript**

```bash
npm install --save astro
npm install --save-dev typescript @types/node
```
Expected: `node_modules/` populated, both deps in `package.json`.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://barborka.party',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Replace `package.json` scripts**

Edit `package.json` so the `scripts` block reads:
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "type-check": "astro check && tsc --noEmit"
}
```

- [ ] **Step 6: Install `@astrojs/check`**

```bash
npm install --save-dev @astrojs/check
```

- [ ] **Step 7: Create minimal `src/pages/index.astro`**

```astro
---
const title = 'barborka.party';
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>{title}</title>
</head>
<body>
  <h1>Hello, barborka.party</h1>
</body>
</html>
```

- [ ] **Step 8: Create `README.md`**

```markdown
# barborka.party

Personal CV / portfolio for Barbora Hulová ([github.com/MissLittleBee](https://github.com/MissLittleBee)). Deployed to https://barborka.party.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build       # output to dist/
npm run preview     # serve dist/ locally
```

## Tech

Astro + TypeScript. Deployed via GitHub Actions to Cloudflare Pages.
See `docs/superpowers/specs/` and `docs/superpowers/plans/` for design notes.
```

- [ ] **Step 9: Run dev server, verify locally**

```bash
npm run dev
```
Expected: starts at `http://localhost:4321/`, page shows "Hello, barborka.party". Stop with `Ctrl-C`.

- [ ] **Step 10: Run build, verify no errors**

```bash
npm run build
```
Expected: `dist/` directory created, `dist/index.html` exists, no TypeScript errors.

- [ ] **Step 11: Add Astro standard `.gitignore` entries**

Replace the existing `.gitignore` (currently only has `.superpowers/`) with:
```
.superpowers/
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.DS_Store
*.log
```

- [ ] **Step 12: Commit**

```bash
git add .gitignore package.json package-lock.json astro.config.mjs tsconfig.json src/ README.md
git commit -m "chore: bootstrap Astro + TypeScript project"
```

---

## Task 2: Set up linting and test runner

**Files:**
- Create: `.eslintrc.cjs`, `vitest.config.ts`, `.nvmrc`
- Modify: `package.json` (add scripts and devDeps)

- [ ] **Step 0: Pin Node version with `.nvmrc`**

Create `.nvmrc` at repo root with content:
```
22
```

Why: Astro 6 (the version installed in Task 1) requires Node ≥ 22.12.0. Pinning here keeps local dev, CI, and contributors aligned. Verify with `node --version` shows v22.x (use `nvm use` if available).

- [ ] **Step 1: Install ESLint + Vitest**

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-astro vitest
```

- [ ] **Step 2: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
  ],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '.astro/'],
};
```

- [ ] **Step 3: Install missing astro parser**

```bash
npm install --save-dev astro-eslint-parser
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Add scripts to `package.json`**

In `package.json` `scripts`, add:
```json
"lint": "eslint . --ext .ts,.astro",
"test": "vitest run"
```

- [ ] **Step 6: Verify each tool runs**

```bash
npm run lint
npm run test
npm run type-check
```
Expected: `lint` exits 0 with no errors (no source files to lint yet), `test` exits 0 with "No test files found, exiting with code 0" or similar, `type-check` exits 0.

- [ ] **Step 7: Commit**

```bash
git add .nvmrc .eslintrc.cjs vitest.config.ts package.json package-lock.json
git -c user.email=barbora.hulova@heureka.group -c user.name="Barbora Hulová" commit -m "chore: pin Node 22, add eslint + vitest

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add palette + global styles

**Files:**
- Create: `src/styles/global.css`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Install fonts**

```bash
npm install --save @fontsource/inter @fontsource/jetbrains-mono
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/inter/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/600.css';

:root {
  --surface:    #040a07;
  --panel:      #0a1f15;
  --panel-edge: rgba(28, 231, 131, 0.08);
  --accent:     #1ce783;
  --accent-dim: #6ee7b7;
  --heading:    #ffffff;
  --body:       #a8bab1;

  --font-sans:  'Inter', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', ui-monospace, monospace;

  --max-width:  1200px;
  --gutter:     clamp(20px, 4vw, 48px);
}

* { box-sizing: border-box; }

html {
  background: var(--surface);
  color: var(--body);
  font-family: var(--font-sans);
  line-height: 1.6;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  min-height: 100vh;
}

h1, h2, h3 {
  color: var(--heading);
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin: 0;
}

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

code, pre, .mono { font-family: var(--font-mono); }

.section-label {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 14px;
  margin-bottom: 14px;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.in-view {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1 !important; transform: none !important; transition: none; }
}
```

- [ ] **Step 3: Create `src/layouts/Base.astro`**

```astro
---
import '~/styles/global.css';
interface Props { title?: string; description?: string; }
const {
  title = 'Barbora Hulová — Backend Developer',
  description = 'Backend developer building APIs. Python, TypeScript, scalable systems.',
} = Astro.props;
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <meta name="theme-color" content="#040a07" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://barborka.party" />
  <meta property="og:image" content="/og-image.png" />
  <title>{title}</title>
</head>
<body>
  <slot />
</body>
</html>
```

- [ ] **Step 4: Update `src/pages/index.astro` to use the layout**

```astro
---
import Base from '~/layouts/Base.astro';
---
<Base>
  <main class="container" style="padding-top:80px">
    <h1>Hello, barborka.party</h1>
    <p>Palette test: <span style="color:var(--accent)">emerald</span> on <span style="color:var(--heading)">white</span> on <span style="color:var(--body)">muted</span>.</p>
  </main>
</Base>
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```
Open `http://localhost:4321/`. Expected: dark `#040a07` background, white heading, muted body text, emerald sample word. Inter for body, no FOUT.

- [ ] **Step 6: Commit**

```bash
git add src/ package.json package-lock.json
git commit -m "feat: palette, fonts, base layout"
```

---

## Task 4: Build the GitHub Actions deploy pipeline (first end-to-end deploy)

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/favicon.svg`

- [ ] **Step 1: Create a temporary favicon**

Create `public/favicon.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#040a07"/><text x="16" y="22" font-family="monospace" font-size="18" font-weight="700" text-anchor="middle" fill="#1ce783">b</text></svg>
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - run: npm ci

      - run: npm run type-check
      - run: npm run lint
      - run: npm run test

      - run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken:    ${{ secrets.CF_API_TOKEN }}
          accountId:   ${{ secrets.CF_ACCOUNT_ID }}
          command:     pages deploy dist --project-name=barbora-cv --branch=main
```

> Note: `cloudflare/pages-action@v1` was deprecated mid-2025. The current path is `wrangler-action@v3` invoking `wrangler pages deploy`. Permission required on the API token: `Account → Cloudflare Pages → Edit`.

- [ ] **Step 3: Push to GitHub for the first time**

```bash
git add .github/ public/
git commit -m "ci: add deploy workflow + favicon"
git branch -M main
git remote add origin git@github.com:MissLittleBee/barbora-cv.git
git push -u origin main
```
Expected: push succeeds.

- [ ] **Step 4: Watch the Actions run**

Open `https://github.com/MissLittleBee/barbora-cv/actions`. Expected: workflow named `deploy` runs, all five script steps green, deploy step succeeds.

- [ ] **Step 5: Attach custom domain in Cloudflare**

In Cloudflare dashboard → Workers & Pages → `barborka-party` → Custom domains → Set up custom domain → `barborka.party`. Click Activate. Cloudflare auto-creates the CNAME.

Repeat for `www.barborka.party`.

- [ ] **Step 6: Verify the live site**

Open `https://barborka.party` in a browser. Expected: TLS padlock green, "Hello, barborka.party" page shown.

- [ ] **Step 7: No commit needed — the pipeline is the deliverable**

---

## Task 5: Build the Nav component

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/Nav.astro`**

```astro
---
const sections = [
  { id: 'about_me', label: '#about' },
  { id: 'career',   label: '#career' },
  { id: 'my_work',  label: '#my_work' },
];
---
<nav class="nav">
  <div class="nav-inner container">
    <a href="#about_me" class="nav-brand">BARBORKA.PARTY</a>
    <div class="nav-links">
      {sections.map(s => (
        <a href={`#${s.id}`}>{s.label}</a>
      ))}
      <a href="#contact" class="nav-cta">#contact &raquo;</a>
    </div>
  </div>
</nav>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(4, 10, 7, 0.85);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--panel-edge);
  }
  .nav-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 0;
  }
  .nav-brand {
    color: var(--heading);
    font-family: var(--font-mono);
    font-weight: 700;
    letter-spacing: 1px;
    font-size: 14px;
  }
  .nav-links {
    display: flex;
    gap: 28px;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 13px;
  }
  .nav-links a { color: var(--body); }
  .nav-links a:hover { color: var(--accent); text-decoration: none; }
  .nav-cta {
    background: #fff;
    color: var(--surface) !important;
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 600;
  }
  .nav-cta:hover { background: var(--accent-dim); }

  @media (max-width: 640px) {
    .nav-links { gap: 14px; font-size: 12px; }
    .nav-links a:not(.nav-cta) { display: none; }
  }
</style>
```

- [ ] **Step 2: Replace `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import Nav from '~/components/Nav.astro';
---
<Base>
  <Nav />
  <main>
    <section id="about_me" class="container" style="padding:120px 0">
      <p class="section-label"># about_me</p>
      <h1 style="font-size:clamp(32px,5vw,52px)">Nav placeholder — sections coming.</h1>
    </section>
  </main>
</Base>
```

- [ ] **Step 3: Verify locally**

```bash
npm run dev
```
Expected: sticky nav at top, brand on left, three text links + white pill `#contact »` button on right. Clicking links scrolls smoothly (will jump to top until other sections exist).

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: sticky nav with section anchors"
```

---

## Task 6: Build the Hero component (#about_me)

**Files:**
- Create: `src/components/Hero.astro`, `src/content/about.md`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/content/about.md`**

```markdown
Software engineer at Heureka Group, building IAM systems — token-based auth, API integrations, the boring-but-critical glue between services. Python first, more TypeScript every week. Outside work: teaching Python with PyLadies CZ and helping organize PyCon CZ. The "green one" — career pivot from pharmacy to tech via a Python script for price tags.
```

- [ ] **Step 2: Create `src/components/Hero.astro`**

```astro
---
import aboutRaw from '~/content/about.md?raw';
const bio = aboutRaw.trim();
---
<section id="about_me" class="hero-section">
  <div class="container">
    <div class="hero-panel">
      <div class="hero-left">
        <p class="section-label"># about_me</p>
        <h1 class="hero-title">
          Barbora Hulová.<br />
          Software engineer.<br />
          APIs &amp; IAM at Heureka.
        </h1>
        <p class="hero-bio">{bio}</p>
        <div class="hero-actions">
          <a href="#contact" class="hero-cta">Get in touch &raquo;</a>
          <span class="hero-scroll">scroll &darr;</span>
        </div>
      </div>
      <aside class="hero-code" aria-hidden="true">
        <div class="hero-code-dots">
          <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
        </div>
        <pre><code><span class="kw">class</span> <span class="cls">Barbora</span>:
    <span class="prop">role</span> = <span class="str">"software engineer"</span>
    <span class="prop">focus</span> = <span class="str">"IAM, APIs"</span>
    <span class="prop">stack</span> = [<span class="str">"python"</span>, <span class="str">"typescript"</span>]
    <span class="prop">teaches</span> = <span class="str">"pyladies cz"</span>

    <span class="kw">def</span> <span class="fn">build</span>(<span class="prop">self</span>):
        <span class="cmt"># keep shipping</span>
</code></pre>
      </aside>
    </div>
  </div>
</section>

<style>
  .hero-section { padding: 32px 0 64px; }
  .hero-panel {
    background: radial-gradient(ellipse at top right, #0c2a1c 0%, #06140d 50%, #040a07 100%);
    border: 1px solid var(--panel-edge);
    border-radius: 20px;
    padding: clamp(32px, 5vw, 64px);
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 32px;
    align-items: center;
    min-height: 420px;
  }
  .hero-title { font-size: clamp(28px, 4.5vw, 48px); font-weight: 700; }
  .hero-bio  { color: var(--body); max-width: 420px; margin-top: 18px; }
  .hero-actions { margin-top: 28px; display: flex; gap: 18px; align-items: center; }
  .hero-cta {
    background: #fff;
    color: var(--surface) !important;
    padding: 12px 22px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
  }
  .hero-cta:hover { background: var(--accent-dim); text-decoration: none; }
  .hero-scroll { font-family: var(--font-mono); font-size: 12px; color: var(--body); }

  .hero-code {
    background: #020604;
    border: 1px solid rgba(28, 231, 131, 0.18);
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 0 80px rgba(28, 231, 131, 0.12);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
  }
  .hero-code pre { margin: 0; white-space: pre; overflow-x: auto; color: var(--body); }
  .hero-code-dots { display: flex; gap: 6px; margin-bottom: 14px; }
  .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
  .dot-r { background: #ef4444; } .dot-y { background: #f59e0b; } .dot-g { background: #1ce783; }
  .kw  { color: var(--accent-dim); }
  .cls { color: #fff; }
  .prop{ color: var(--accent); }
  .str { color: #e6f4ee; }
  .fn  { color: #fff; }
  .cmt { color: var(--body); }

  @media (max-width: 900px) {
    .hero-panel { grid-template-columns: 1fr; }
    .hero-code { font-size: 12px; }
  }
</style>
```

- [ ] **Step 3: Wire `Hero` into `src/pages/index.astro`**

Replace the file with:
```astro
---
import Base from '~/layouts/Base.astro';
import Nav from '~/components/Nav.astro';
import Hero from '~/components/Hero.astro';
---
<Base>
  <Nav />
  <main>
    <Hero />
  </main>
</Base>
```

- [ ] **Step 4: Verify locally**

```bash
npm run dev
```
Expected: floating dark-emerald panel below nav. Left side: green `# about_me` label, big white headline, muted bio, white pill CTA, "scroll ↓". Right side: terminal-styled code block with class definition. On narrow screens, code stacks below.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: hero section with code card"
```

---

## Task 7: Build the Timeline component (#career)

**Files:**
- Create: `src/lib/career.ts`, `src/components/Timeline.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/lib/career.ts`**

```ts
export type CareerEntry = {
  role: string;
  company: string;
  start: string;       // 'YYYY-MM'
  end: string | 'present';
  bullets: string[];
  stack: string[];
};

export const career: CareerEntry[] = [
  {
    role: 'Software Engineer',
    company: 'Heureka Group',
    start: '2026-01',
    end: 'present',
    bullets: [
      'Designing and implementing IAM solutions — secure, scalable systems bridging internal and external services in the Heureka ecosystem.',
      'Security, token-based authorization, API integrations.',
      'System reliability via Grafana, Loki, Sentry.',
      'Advocate for refactoring, documentation, and automated testing.',
    ],
    stack: ['Python', 'TypeScript', 'Docker', 'Kubernetes', 'Terraform', 'GCP', 'MongoDB', 'MySQL', 'GitLab CI/CD'],
  },
  {
    role: 'Lecturer (volunteer)',
    company: 'PyLadies CZ',
    start: '2023-05',
    end: 'present',
    bullets: [
      'Teaching women and girls Python fundamentals and algorithmic thinking.',
      'Iteratively improving curriculum with modern tooling and best practices.',
      'Building a more diverse Czech tech community.',
    ],
    stack: ['Python', 'Algorithms', 'Mentoring'],
  },
  {
    role: 'Test Automation Engineer',
    company: 'Eurosoftware',
    start: '2025-06',
    end: '2026-01',
    bullets: [
      'Implemented and maintained automated test solutions for enterprise products.',
      'Improved test coverage and collaborated with dev + QA on delivery pipelines.',
    ],
    stack: ['Test Automation', 'QA', 'CI/CD'],
  },
  {
    role: 'Python Trainee',
    company: 'Orgis IT',
    start: '2025-02',
    end: '2025-06',
    bullets: [
      'Three-month internship focused on modern technologies and backend development in Python.',
    ],
    stack: ['Python', 'PostgreSQL'],
  },
  {
    role: 'C++ Developer & IT Consultant',
    company: 'Medicalc software',
    start: '2024-09',
    end: '2025-02',
    bullets: [
      'Hospital information system development in C++.',
      'Earlier: requirements analysis, customer-facing implementation, manual + integration testing.',
    ],
    stack: ['C++', 'PostgreSQL', 'Integration Testing'],
  },
  {
    role: 'Pharmaceutical Technician',
    company: 'Plzeňská lékárna k.s.',
    start: '2018-07',
    end: '2024-09',
    bullets: [
      'Six years preparing medicines, supporting patients, running a small lab.',
      'Wrote a Python tool (during PyLadies advanced course) automating pharmacy price tags — the career pivot into tech.',
    ],
    stack: ['Pharmacy', 'Python (early)'],
  },
];
```

- [ ] **Step 2: Create `src/components/Timeline.astro`**

```astro
---
import { career } from '~/lib/career.ts';

function fmt(d: string): string {
  if (d === 'present') return 'now';
  const [y, m] = d.split('-');
  return `${y}-${m}`;
}
---
<section id="career" class="career-section">
  <div class="container">
    <p class="section-label"># career</p>
    <h2 class="career-title">Where I've worked</h2>
    <ol class="timeline">
      {career.map((entry, i) => (
        <li class={`timeline-item ${i === 0 ? 'is-current' : ''}`}>
          <span class="node" aria-hidden="true"></span>
          <div class="entry">
            <div class="entry-head">
              <h3 class="role">{entry.role}</h3>
              <span class="dates mono">{fmt(entry.start)} — {fmt(entry.end)}</span>
            </div>
            <div class="company">{entry.company}</div>
            <ul class="bullets">
              {entry.bullets.map(b => <li>{b}</li>)}
            </ul>
            <div class="stack">
              {entry.stack.map(s => <span class="chip mono">{s}</span>)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .career-section { padding: 80px 0; }
  .career-title { font-size: clamp(24px, 3vw, 34px); margin-bottom: 36px; }

  .timeline { list-style: none; padding: 0; margin: 0; position: relative; }
  .timeline-item {
    position: relative;
    padding-left: 32px;
    padding-bottom: 36px;
    border-left: 2px solid var(--panel-edge);
  }
  .timeline-item:last-child { padding-bottom: 0; }

  .node {
    position: absolute;
    left: -8px;
    top: 4px;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: var(--panel);
    border: 2px solid var(--accent);
  }
  .is-current .node { background: var(--accent); box-shadow: 0 0 0 4px rgba(28, 231, 131, 0.15); }

  .entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .role  { font-size: 18px; }
  .dates { color: var(--accent); font-size: 12px; }
  .company { color: var(--body); margin-top: 4px; }

  .bullets { padding-left: 18px; margin: 12px 0; color: var(--body); }
  .bullets li { margin: 4px 0; }

  .stack { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .chip {
    background: var(--panel);
    border: 1px solid var(--panel-edge);
    color: var(--accent-dim);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
  }
</style>
```

- [ ] **Step 3: Wire `Timeline` into `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import Nav from '~/components/Nav.astro';
import Hero from '~/components/Hero.astro';
import Timeline from '~/components/Timeline.astro';
---
<Base>
  <Nav />
  <main>
    <Hero />
    <Timeline />
  </main>
</Base>
```

- [ ] **Step 4: Verify locally**

```bash
npm run dev
```
Expected: below hero, `# career` label, "Where I've worked" heading, vertical line on left with one filled green node (current role) and entry on the right. Stack chips visible.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: career timeline with typed data"
```

---

## Task 8: Build `lib/github.ts` with tests (#my_work data layer)

**Files:**
- Create: `src/lib/github.ts`, `tests/github.test.ts`

This task is TDD — test first.

- [ ] **Step 1: Write failing tests in `tests/github.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPortfolioRepos } from '~/lib/github';

const fakeRepos = [
  { name: 'a', description: null, html_url: 'u1', stargazers_count: 5, language: 'Python', updated_at: '2026-01-01T00:00:00Z', topics: ['portfolio'] },
  { name: 'b', description: 'x', html_url: 'u2', stargazers_count: 1, language: 'JS',     updated_at: '2026-05-01T00:00:00Z', topics: ['portfolio'] },
  { name: 'c', description: 'y', html_url: 'u3', stargazers_count: 9, language: 'Go',     updated_at: '2026-03-01T00:00:00Z', topics: ['other'] },
];

describe('fetchPortfolioRepos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => fakeRepos,
    })));
    vi.stubEnv('GH_TOKEN', 'test-token');
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('returns only repos tagged "portfolio"', async () => {
    const result = await fetchPortfolioRepos();
    expect(result.map(r => r.name)).toEqual(['b', 'a']);
  });

  it('sorts by updated_at descending', async () => {
    const result = await fetchPortfolioRepos();
    expect(result[0].updated_at > result[1].updated_at).toBe(true);
  });

  it('throws on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(fetchPortfolioRepos()).rejects.toThrow(/500/);
  });
});
```

Note: tsconfig path `~/*` already points at `src/*`. Vitest needs the same alias.

- [ ] **Step 2: Configure Vitest to resolve the `~/` alias**

Update `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Run tests, verify they fail (module not found)**

```bash
npm run test
```
Expected: 3 failures, "Cannot find module '~/lib/github'" (or similar).

- [ ] **Step 4: Create `src/lib/github.ts`**

```ts
export type Repo = {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  topics: string[];
};

const API = 'https://api.github.com/users/MissLittleBee/repos?per_page=100';

export async function fetchPortfolioRepos(): Promise<Repo[]> {
  const token = import.meta.env.GH_TOKEN ?? process.env.GH_TOKEN;
  const res = await fetch(API, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const all = (await res.json()) as Repo[];
  return all
    .filter(r => r.topics?.includes('portfolio'))
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
}
```

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm run test
```
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/github.ts tests/github.test.ts vitest.config.ts
git commit -m "feat: github repo fetcher with topic filter + tests"
```

---

## Task 9: Build `RepoGrid` and `RepoCard` (#my_work UI)

**Files:**
- Create: `src/components/RepoCard.astro`, `src/components/RepoGrid.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `src/components/RepoCard.astro`**

```astro
---
import type { Repo } from '~/lib/github.ts';
interface Props { repo: Repo; }
const { repo } = Astro.props;

function ago(iso: string): string {
  const days = Math.floor((Date.now() - +new Date(iso)) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
---
<a class="repo-card" href={repo.html_url} target="_blank" rel="noopener noreferrer">
  <h3 class="repo-name mono">{repo.name}</h3>
  {repo.description && <p class="repo-desc">{repo.description}</p>}
  <div class="repo-meta mono">
    <span>★ {repo.stargazers_count}</span>
    {repo.language && <span>● {repo.language}</span>}
    <span>updated {ago(repo.updated_at)}</span>
  </div>
</a>

<style>
  .repo-card {
    display: block;
    background: var(--panel);
    border: 1px solid var(--panel-edge);
    border-radius: 10px;
    padding: 20px;
    color: var(--body) !important;
    transition: border-color 0.2s, transform 0.2s;
  }
  .repo-card:hover {
    border-color: rgba(28, 231, 131, 0.4);
    transform: translateY(-2px);
    text-decoration: none;
  }
  .repo-name { color: var(--heading); font-size: 16px; font-weight: 600; }
  .repo-desc { margin: 8px 0 14px; font-size: 14px; }
  .repo-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--accent-dim); }
</style>
```

- [ ] **Step 2: Create `src/components/RepoGrid.astro`**

```astro
---
import { fetchPortfolioRepos, type Repo } from '~/lib/github.ts';
import RepoCard from './RepoCard.astro';

let repos: Repo[] = [];
let error: string | null = null;
try {
  repos = await fetchPortfolioRepos();
} catch (e) {
  error = e instanceof Error ? e.message : 'unknown error';
}
---
<section id="my_work" class="work-section">
  <div class="container">
    <p class="section-label"># my_work</p>
    <h2 class="work-title">Selected public repos</h2>
    <p class="work-hint">Tagged <code>portfolio</code> on <a href="https://github.com/MissLittleBee" target="_blank" rel="noopener noreferrer">github.com/MissLittleBee</a>.</p>
    {error && <p class="work-error">Could not fetch repos at build time: {error}</p>}
    {!error && repos.length === 0 && <p class="work-error">No repos tagged <code>portfolio</code> yet.</p>}
    <div class="repo-grid">
      {repos.map(r => <RepoCard repo={r} />)}
    </div>
  </div>
</section>

<style>
  .work-section { padding: 80px 0; }
  .work-title { font-size: clamp(24px, 3vw, 34px); margin-bottom: 12px; }
  .work-hint  { margin-bottom: 28px; }
  .work-error { color: #ef4444; margin: 12px 0; }
  .repo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
</style>
```

- [ ] **Step 3: Wire `RepoGrid` into `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import Nav from '~/components/Nav.astro';
import Hero from '~/components/Hero.astro';
import Timeline from '~/components/Timeline.astro';
import RepoGrid from '~/components/RepoGrid.astro';
---
<Base>
  <Nav />
  <main>
    <Hero />
    <Timeline />
    <RepoGrid />
  </main>
</Base>
```

- [ ] **Step 4: Verify locally — tag at least one repo first**

On GitHub, open any of your repos → About (right sidebar) → gear icon → Topics → add `portfolio` → save. Do this for at least one repo so the grid renders.

Then:
```bash
GH_TOKEN=<your_pat> npm run build
npm run preview
```
Expected: `#my_work` section shows your tagged repo(s) as cards with star count, language, "updated Xd ago". Cards link to GitHub on click.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: my_work grid driven by GitHub topic filter"
```

---

## Task 10: Build the Contact section with CV download

**Files:**
- Create: `src/components/Contact.astro`, `public/cv.pdf` (your CV)
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Place your CV PDF**

Save your CV as `public/cv.pdf`. Strip full home address / national ID / phone before committing — email + city only. File must exist; if you don't have one yet, export a Wix CV or create a placeholder.

- [ ] **Step 2: Create `src/components/Contact.astro`**

```astro
---
const links = [
  { label: 'email',    value: 'barbora.hulova@heureka.group', href: 'mailto:barbora.hulova@heureka.group' },
  { label: 'github',   value: '@MissLittleBee',               href: 'https://github.com/MissLittleBee' },
  { label: 'linkedin', value: '/in/barbora-hulova',           href: 'https://www.linkedin.com/in/barbora-hulova' },
];
---
<section id="contact" class="contact-section">
  <div class="container">
    <p class="section-label"># contact</p>
    <h2 class="contact-title">Let's talk.</h2>
    <ul class="contact-list mono">
      {links.map(l => (
        <li>
          <span class="contact-key">{l.label} =</span>
          <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">"{l.value}"</a>
        </li>
      ))}
    </ul>
    <a class="cv-button" href="/cv.pdf" download>
      Download CV (PDF) &darr;
    </a>
  </div>
</section>

<style>
  .contact-section { padding: 80px 0 120px; }
  .contact-title { font-size: clamp(24px, 3vw, 34px); margin-bottom: 28px; }
  .contact-list { list-style: none; padding: 0; margin: 0 0 36px; font-size: 16px; line-height: 2; }
  .contact-key  { color: var(--accent); margin-right: 8px; }
  .cv-button {
    display: inline-block;
    background: var(--accent);
    color: var(--surface) !important;
    padding: 14px 24px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
  }
  .cv-button:hover { background: #fff; text-decoration: none; }
</style>
```

> **Verify:** if the email or LinkedIn URL above is wrong, fix the values before committing.

- [ ] **Step 3: Wire `Contact` into `src/pages/index.astro`**

```astro
---
import Base from '~/layouts/Base.astro';
import Nav from '~/components/Nav.astro';
import Hero from '~/components/Hero.astro';
import Timeline from '~/components/Timeline.astro';
import RepoGrid from '~/components/RepoGrid.astro';
import Contact from '~/components/Contact.astro';
---
<Base>
  <Nav />
  <main>
    <Hero />
    <Timeline />
    <RepoGrid />
    <Contact />
  </main>
</Base>
```

- [ ] **Step 4: Verify locally**

```bash
npm run dev
```
Expected: `#contact` section with three "key = value" rows in mono font, green CV download button. Clicking button downloads `cv.pdf`.

- [ ] **Step 5: Commit**

```bash
git add src/ public/cv.pdf
git commit -m "feat: contact section with CV download"
```

---

## Task 11: Add reveal-on-scroll animations

**Files:**
- Create: `src/components/Reveal.astro`, `src/scripts/reveal.ts`
- Modify: `src/layouts/Base.astro`, all section components

- [ ] **Step 1: Create `src/scripts/reveal.ts`**

```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.2 }
);

const init = () => {
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
};

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: Create `src/components/Reveal.astro`**

```astro
---
interface Props { delay?: number; }
const { delay = 0 } = Astro.props;
const style = delay > 0 ? `transition-delay:${delay}ms` : undefined;
---
<div class="reveal" {style}>
  <slot />
</div>
```

- [ ] **Step 3: Load `reveal.ts` from `Base.astro`**

In `src/layouts/Base.astro`, just before `</body>`, add:
```astro
<script>
  import '~/scripts/reveal.ts';
</script>
```

- [ ] **Step 4: Wrap section content in `<Reveal>`**

In `src/components/Hero.astro`, wrap the inside of `.hero-panel`'s `.hero-left` div with `<Reveal>`. Repeat for `<Timeline>`'s `<ol class="timeline">`, `<RepoGrid>`'s grid, and `<Contact>`'s content. Import via:
```astro
import Reveal from '~/components/Reveal.astro';
```

Example for `Timeline.astro`:
```astro
<Reveal>
  <ol class="timeline">
    {career.map(...)}
  </ol>
</Reveal>
```

For `RepoGrid.astro`, wrap each card with a delay step to stagger:
```astro
<div class="repo-grid">
  {repos.map((r, i) => (
    <Reveal delay={i * 80}>
      <RepoCard repo={r} />
    </Reveal>
  ))}
</div>
```

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```
Expected: scrolling down to each section, content fades up smoothly. Toggle macOS "Reduce motion" in System Settings → Accessibility → Display, reload, verify no animation runs.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: reveal-on-scroll with reduced-motion respect"
```

---

## Task 12: SEO, OpenGraph image, accessibility & Lighthouse pass

**Files:**
- Create: `public/og-image.png` (1200x630 PNG)
- Modify: `src/layouts/Base.astro` if any meta needs updating

- [ ] **Step 1: Create an OpenGraph image**

Generate `public/og-image.png` (1200x630). Quick options:
- Screenshot the hero panel at exactly 1200x630.
- Or use https://og-playground.vercel.app/ to compose one, download as PNG.

- [ ] **Step 2: Run Lighthouse locally**

```bash
npm run build
npm run preview
```
Open the preview URL in Chrome, DevTools → Lighthouse → Mobile, Performance + Accessibility + Best Practices + SEO.

Expected scores: Performance ≥ 95, Accessibility ≥ 95, SEO 100. Address any flagged issues (most likely: contrast on a chip, missing `aria-label` on a nav link).

- [ ] **Step 3: Verify reduced-motion still passes**

Toggle "Reduce motion" in OS settings, reload preview. Animations should not run.

- [ ] **Step 4: Verify keyboard nav**

Tab through the page. Every interactive element (nav links, CTA, repo cards, social links, CV button) must show a visible focus outline. If any are missing, add to `global.css`:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

- [ ] **Step 5: Commit**

```bash
git add public/og-image.png src/styles/global.css
git commit -m "feat: og image, focus styles, lighthouse pass"
```

---

## Task 13: Deploy and verify the live site

- [ ] **Step 1: Push everything**

```bash
git push origin main
```

- [ ] **Step 2: Watch GitHub Actions**

Open `https://github.com/MissLittleBee/barbora-cv/actions`. Expected: all five script gates green, deploy step green.

- [ ] **Step 3: Visual smoke check on `https://barborka.party`**

Verify each item:
- [ ] Site loads with valid TLS padlock.
- [ ] Sticky nav present, brand on left.
- [ ] Clicking `#about`, `#career`, `#my_work`, `#contact` scrolls smoothly to each section.
- [ ] Hero shows headline + code card. Code card stacks below on narrow viewport.
- [ ] `#career` shows timeline with green current-role node.
- [ ] `#my_work` shows repo cards from your `portfolio`-tagged repos with star + language + update age.
- [ ] Repo cards open GitHub in a new tab on click.
- [ ] `#contact` shows three social links, CV button downloads `cv.pdf`.
- [ ] OpenGraph: share `https://barborka.party` link in Slack / Discord / `https://www.opengraph.xyz/`, verify the image + title preview.
- [ ] Run Lighthouse on the **live** URL — Performance ≥ 95, Accessibility ≥ 95.
- [ ] Reduced-motion test passes.

- [ ] **Step 4: Tag the v1 release**

```bash
git tag v1.0.0
git push origin v1.0.0
```

- [ ] **Step 5: Update the Wix site or its DNS**

Decide: take the Wix site offline, or leave it as a backup. If keeping it, leave alone — the new site is on a different domain.

---

## Done state

After Task 13, you have:
- A public GitHub repo with green CI on every commit.
- A live site at `https://barborka.party` with TLS.
- Type-checked, linted, tested deploys.
- A live `#my_work` feed driven by GitHub topics — to add a project, tag it `portfolio` on GitHub and push any trivial change to trigger a redeploy.
