# RainhadaPaz — Playwright-BDD · API · AI testing

**Repository:** [github.com/TiagoQAmorim/RainhadaPaz-Playwright-BDD-API-AI](https://github.com/TiagoQAmorim/RainhadaPaz-Playwright-BDD-API-AI)

Parish portal (Next.js). **This README focuses on automated tests:** Playwright + Gherkin (BDD), HTTP API examples, and AI-assisted checks.

## Requirements

- Node.js 20+
- npm
- Chromium (installed via `npx playwright install` on first run if needed)

## Setup for tests

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
```

Minimum variables for E2E:

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin login scenarios (seed defaults in `.env.example`) |
| `CANDLE_FREE_MODE=true` | Light virtual candles without payment |
| `RAFFLE_FREE_MODE=true` | Raffle flows without Mercado Pago |
| `PLAYWRIGHT_BASE_URL` | Optional; defaults to `http://localhost:3000` |

Admin create scenarios **write to the local SQLite DB** (`prisma/dev.db`).

## Playwright projects

| Project | What it runs | Generated / path |
|---------|----------------|------------------|
| `portal` | UI + Gherkin (`portal.feature`, `api.feature`) | `.features-gen/portal/` |
| `api` | Raw `request` examples (no browser) | `e2e/api/*.spec.ts` |
| `ai` | Gherkin AI suite only | `.features-gen/ai/` |

Playwright starts the dev server automatically (`npm run dev`) unless one is already running locally.

## Commands

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | BDD portal + API features (21 scenarios) |
| `npm run test:e2e:api` | API example specs only (4 tests) |
| `npm run test:e2e:ai` | AI feature file (2 scenarios) |
| `npm run test:e2e:all` | All Playwright projects |
| `npm run test:e2e:ui` | Playwright UI mode — portal project |
| `npm run test:e2e:ui:ai` | Playwright UI mode — AI project |
| `npm run bddgen` | Regenerate specs from `.feature` files |
| `npm run test` | Unit tests (Vitest, `src/**/*.test.ts`) |

**Watch the browser (full portal suite):**

```bash
npx bddgen
npx playwright test --project=portal --headed
```

**UI explorer:**

```bash
npm run test:e2e:ui
```

## Layout (`e2e/`)

```
e2e/
  features/
    portal.feature    # Public site + admin flows
    api.feature       # JSON endpoints (Gherkin + request fixture)
    ai.feature        # LLM judge + simulated AI contract
  steps/              # Step definitions (English)
  api/
    api.example.spec.ts   # Template for new API tests
  lib/
    ai-judge.ts       # Optional OpenAI-compatible LLM judge
    ai-rubric.ts      # Parish rubric sent to the LLM
    judge-contract.ts # Simulated non-deterministic output + deterministic text rules
    http-helpers.ts
playwright.config.ts
```

After editing `.feature` or step files, run `npx bddgen` (or use any `test:e2e*` script, which runs it for you).

Config note: BDD loads only `e2e/features/**/*.feature` and `e2e/steps/**/*.ts`, so API/AI spec folders are not mixed into step discovery.

## Gherkin (playwright-bdd)

- Features and steps are written in **English**.
- The live site UI is **Brazilian Portuguese** — assertions still target real labels (e.g. `Avisos`, `Entrar no painel`).

Example fragment:

```gherkin
Scenario: Admin login with valid credentials
  Given I am on the admin login page
  When I submit valid admin credentials
  Then I should be on the admin dashboard
```

## API test examples

**Gherkin:** `e2e/features/api.feature` + `e2e/steps/api.steps.ts`

**Copy-paste template:** `e2e/api/api.example.spec.ts`

```typescript
const res = await request.post(`${baseURL}/api/admin/login`, {
  data: { email, password },
});
expect(res.status()).toBe(401);
```

Run: `npm run test:e2e:api`

## AI testing examples

Two complementary patterns in `e2e/features/ai.feature`:

### 1. Real LLM judge (`@ai @llm`)

- Opens `/`, sends visible `main` text to an OpenAI-compatible chat model.
- Expects JSON `{ "pass": boolean, "reason": string }` and asserts `pass === true`.
- **Non-deterministic** (`temperature` > 0); may flake — project `ai` uses extra retries.

Configure in `.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com   # optional (Azure, LiteLLM, etc.)
E2E_AI_MODEL=gpt-4o-mini                 # optional
```

Without `OPENAI_API_KEY`, the `@llm` scenario is **skipped**.

Implementation: `e2e/lib/ai-judge.ts`, steps in `e2e/steps/ai.steps.ts`.

### 2. Simulated AI + deterministic text rules (`@ai @contract @simulated`)

- **Does not call an LLM.** `simulateNonDeterministicAiJudgeOutput()` fakes variable `pass` / `reason` strings.
- **Deterministic oracle:** `assertDeterministicTextRules()` checks length, no HTML, word count, charset, etc., as if validating free-form AI text.

Use this pattern when you want stable CI without API cost: non-deterministic *source*, deterministic *validation*.

Implementation: `e2e/lib/judge-contract.ts`, steps in `e2e/steps/ai-contract.steps.ts`.

Run only AI Gherkin:

```bash
npm run test:e2e:ai
```

## Unit tests

```bash
npm run test
```

Vitest covers isolated library logic under `src/**/*.test.ts` (raffle rules, candles, etc.) — no browser.

## Troubleshooting

- **Stale steps / missing scenarios:** run `npx bddgen`.
- **Port 3000 busy:** stop other dev servers or set `PLAYWRIGHT_BASE_URL`.
- **Prisma client out of date:** `npm run db:refresh-client` (restart dev server if EPERM on Windows).

## App setup (short)

For local development beyond tests: `npm run dev` → [http://localhost:3000](http://localhost:3000), admin at `/admin/login`. See `.env.example` for Mercado Pago and production settings.
