# Base-Shop Security Audit Plan

## TODO
- [ ] Confirm data owners for each slice before starting manual review interviews.
- [ ] Capture evidence of all auth flows (session + NextAuth) in threat model notes.
- [ ] Schedule deep dives with infra team on Cloudflare deployment and cron triggers.
- [ ] Align audit timelines with availability of Cypress E2E maintainers for reproduction help.
- [ ] Track remediation tickets per slice in the security backlog once findings emerge.

## 1. High-level system map
### Languages & frameworks
- **TypeScript / React 19 / Next.js 15** for CMS and shop applications, deployed via Cloudflare Pages adapter (`README.md`, `next.config.mjs`).
- **Cloudflare Workers** runtime for the API worker routes (`wrangler.toml`, `apps/api/src/routes/**`).
- **Node.js scripts** and CLI tooling orchestrated through pnpm workspaces (`package.json` scripts section).
- **Prisma + PostgreSQL** data models defined in `packages/platform-core/prisma/schema.prisma`.

### Entry points & workloads
- **CMS Next.js app** exposes API routes for deploy, media upload, CSV import, and SEO tools (`apps/cms/src/app/api/**`).
- **Shop BCD Next.js app** handles customer-facing auth, account, checkout, tax/shipping, and preview APIs (`apps/cover-me-pretty/src/app/api/**`).
- **Cloudflare worker API** provides upgrade-preview and publish endpoints for shops (`apps/api/src/routes/components/[shopId].ts`, `apps/api/src/routes/shop/[id]/publish-upgrade.ts`).
- **Scheduled workers / cron jobs** for SEO audits and editorial publishing (`functions/src/seoAudit.ts`, `functions/src/publishEditorial.ts`, `wrangler.toml` cron trigger).
- **Background services** like deposit release, reverse logistics, and stock alerts in `packages/platform-machine/src/**` and `packages/platform-core/src/services/**`.
- **CLI tooling** for shop initialization, inventory import/export, deposit release, etc. under `scripts/src/*.ts` and pnpm commands in `package.json`.

### Authentication & authorization
- **NextAuth credentials flow** for CMS admins with argon2 password verification and role-based session claims (`apps/cms/src/auth/options.ts`).
- **Customer session + MFA service** built on iron-session cookies with optional Redis backing (`packages/auth/src/session.ts`, `packages/auth/src/store.ts`, `packages/auth/src/mfa.ts`).
- **RBAC helpers** and permission maps consumed by both CMS and platform services (`packages/auth/src/rbac.ts`, `packages/auth/src/permissions.ts`).

### Storage & state
- **Prisma/PostgreSQL** for core entities (shops, pages, orders, users, MFA secrets) with optional JSON fallbacks controlled by `*_BACKEND` env vars (`packages/platform-core/prisma/schema.prisma`, `docs/persistence.md`, `packages/platform-core/src/repositories/**`).
- **Filesystem data root** for offline/demo storage resolved via `resolveDataRoot` (`packages/platform-core/src/dataRoot.ts`, `data/shops/**`).
- **Cloudflare KV** for cart state (`wrangler.toml`) and optional Redis for customer sessions (`packages/auth/src/store.ts`).

### Outbound integrations & third parties
- **Stripe** server SDK / fetch client with optional mock mode (`packages/stripe/src/index.ts`, `packages/platform-core/src/handleStripeWebhook.ts`, `packages/platform-machine/src/releaseDepositsService.ts`).
- **Email providers** (SendGrid, Resend) for campaigns and alerts (`packages/email/src/providers/sendgrid.ts`, `packages/email/src/providers/resend.ts`, `packages/platform-core/src/services/stockAlert.server.ts`).
- **Sanity headless CMS** for editorial content (`packages/sanity/src/index.ts`, `functions/src/publishEditorial.ts`).
- **Analytics / SEO tooling** via in-house modules and outbound webhook targets (`functions/src/seoAudit.ts`, `packages/platform-core/src/analytics/index.ts`).

### Configuration & secret sources
- **Central env schema** enforcing required secrets and feature flags (`packages/config/src/env/core.ts`).
- **Environment reference** documenting all expected variables and fallbacks (`docs/.env.reference.md`).
- **Shop-level config files** persisted under `data/shops/<id>/*.json` and mutated by admin workflows (`apps/cms/src/actions/deployShop.server.ts`).

### Testing & coverage hot spots
- **Extensive Jest suites** for repositories, services, and worker routes (`apps/api/src/routes/**/__tests__`, `packages/platform-core/src/**/__tests__`, `packages/auth/src/__tests__`).
- **Cypress E2E coverage** for CMS, dashboard, and shop flows (`apps/cms/cypress/e2e/*.cy.ts`).
- **Unit tests for Next APIs** across shop and CMS apps (`apps/cover-me-pretty/src/app/api/**/route.test.ts`, `apps/cms/src/app/api/**/__tests__`).
- **Docs** describing test modes and Prisma stubs vs. live DB (`__tests__/docs/testing.md`).

## 2. Externally reachable surfaces & trust boundaries
- **Public shopper surface:** `/apps/cover-me-pretty` routes, static pages, and API endpoints rely on signed customer sessions; they interact with Prisma and JSON stores through `@platform-core` repositories (`apps/cover-me-pretty/src/app/api/login/route.ts`, `packages/platform-core/src/orders/creation.ts`). Trust boundary between anonymous users, authenticated customers, and backend services.
- **CMS admin surface:** Protected Next.js routes under `/apps/cms` for media upload, CSV imports, deploy actions, and provider management. Relies on NextAuth and RBAC, writes to `data/shops/<id>` and triggers build/deploy commands (`apps/cms/src/app/api/upload-csv/[shop]/route.ts`, `apps/cms/src/actions/deployShop.server.ts`). Trust boundary between authenticated admins and filesystem/CLI execution environment.
- **Upgrade worker API:** Cloudflare Worker endpoints for component diffs and publishing upgrades require bearer tokens but run privileged commands (`apps/api/src/routes/components/[shopId].ts`, `apps/api/src/routes/shop/[id]/publish-upgrade.ts`). Boundary between remote callers with token access and repository filesystem/child process execution.
- **Scheduled jobs:** Cron-triggered SEO audits and editorial publishing iterate over all shops, send email, and append to JSONL logs (`functions/src/seoAudit.ts`, `functions/src/publishEditorial.ts`). Trust boundary between Cloudflare scheduler and outbound providers/analytics store.
- **Stripe & email webhooks/outbound:** Stripe webhook handlers and refund automation depend on secrets and call out to Stripe APIs, while stock alerts hit arbitrary webhooks (`packages/platform-core/src/handleStripeWebhook.ts`, `packages/platform-machine/src/releaseDepositsService.ts`, `packages/platform-core/src/services/stockAlert.server.ts`).
- **CLI / operator boundary:** Scripts under `scripts/src` perform network requests to CMS APIs, mutate filesystem data, and run shell commands (`scripts/src/inventory.ts`, `scripts/src/init-shop.ts`). Operators executing them must supply trusted environment variables/secrets.

## 3. Audit slices overview
| ID | Slice | Scope highlights | Est. review effort |
|----|-------|------------------|--------------------|
| S1 | CMS Next.js admin APIs | `apps/cms/src/app/api/**`, server actions, auth glue | 2.0 days |
| S2 | Shopper API & UI flows | `apps/cover-me-pretty/src/app/api/**`, related pages/hooks | 2.0 days |
| S3 | Auth & session platform | `packages/auth/src/**`, CMS NextAuth config | 1.5 days |
| S4 | Platform data repositories | `packages/platform-core/src/repositories/**`, `dataRoot` | 1.5 days |
| S5 | Platform services & webhooks | `packages/platform-core/src/services/**`, `webhookHandlers/**` | 1.5 days |
| S6 | Payments & upgrades pipeline | `packages/stripe/src/**`, upgrade worker routes | 1.0 day |
| S7 | Email & notification stack | `packages/email/src/**`, stock alerts, marketing flows | 1.0 day |
| S8 | Configuration & secrets enforcement | `packages/config/src/env/**`, `.env` references, middleware | 0.8 day |
| S9 | Scheduled jobs & background workers | `functions/src/**`, `packages/platform-machine/src/**` | 1.2 days |
| S10 | Operator & automation scripts | `scripts/src/**`, CLI integration tests | 1.0 day |
| S11 | Cloudflare worker APIs | `apps/api/src/routes/**`, wrangler config | 1.0 day |

## 4. Slice deep dives
### S1 – CMS Next.js admin APIs (`apps/cms`)
Focus areas: upload/import endpoints, deploy actions, provider integrations.
- **Top OWASP risks to probe:**
  1. A01:2021 – Broken Access Control (verify admin role enforcement in API handlers such as `apps/cms/src/app/api/deploy-shop/route.ts`).
  2. A03:2021 – Injection (Busboy CSV upload to filesystem, JSON writes in `apps/cms/src/app/api/upload-csv/[shop]/route.ts`).
  3. A05:2021 – Security Misconfiguration (media metadata updates, file path assumptions in `apps/cms/src/app/api/media/route.ts`).
  4. A08:2021 – Software and Data Integrity Failures (deploy actions invoking `pnpm` builds via `apps/cms/src/actions/deployShop.server.ts`).
  5. A09:2021 – Security Logging & Monitoring Failures (ensure errors logged with context but without leaking secrets).
- **Start with files:**
  - `apps/cms/src/app/api/deploy-shop/route.ts`
  - `apps/cms/src/app/api/upload-csv/[shop]/route.ts`
  - `apps/cms/src/app/api/media/route.ts`
  - `apps/cms/src/app/api/providers/[provider]/route.ts`
  - `apps/cms/src/actions/deployShop.server.ts`

### S2 – Shopper API & UI flows (`apps/cover-me-pretty`)
Covers customer login, session management, account/profile updates, checkout flows.
- **Top OWASP risks to probe:**
  1. A07:2021 – Identification and Authentication Failures (login + MFA in `apps/cover-me-pretty/src/app/api/login/route.ts`).
  2. A01:2021 – Broken Access Control (session-gated resources like `apps/cover-me-pretty/src/app/api/orders/route.ts`).
  3. A02:2021 – Cryptographic Failures (CSRF headers, cookie secrets consumed from `@auth`).
  4. A03:2021 – Injection (JSON parsing and Prisma usage via `@platform-core` in profile/tax endpoints).
  5. A09:2021 – Security Logging & Monitoring Failures (rate limiting + event logging coverage).
- **Start with files:**
  - `apps/cover-me-pretty/src/app/api/login/route.ts`
  - `apps/cover-me-pretty/src/app/api/account/profile/route.ts`
  - `apps/cover-me-pretty/src/app/api/orders/route.ts`
  - `apps/cover-me-pretty/src/app/api/return-request/route.ts`
  - `apps/cover-me-pretty/src/app/api/tax/route.ts`

### S3 – Auth & session platform (`packages/auth`, CMS auth config)
Ensure shared session, permission, and MFA logic is hardened.
- **Top OWASP risks to probe:**
  1. A07:2021 – Identification and Authentication Failures (cookie/session rotation in `packages/auth/src/session.ts`).
  2. A02:2021 – Cryptographic Failures (iron-session secret, OTP generation in `packages/auth/src/mfa.ts`).
  3. A01:2021 – Broken Access Control (RBAC helpers in `packages/auth/src/requirePermission.ts`).
  4. A05:2021 – Security Misconfiguration (session store selection in `packages/auth/src/store.ts`).
  5. A04:2021 – Insecure Design (default roles/permissions in `packages/auth/src/permissions.json`).
- **Start with files:**
  - `packages/auth/src/session.ts`
  - `packages/auth/src/store.ts`
  - `packages/auth/src/mfa.ts`
  - `packages/auth/src/requirePermission.ts`
  - `apps/cms/src/auth/options.ts`

### S4 – Platform data repositories (`packages/platform-core/src/repositories`, `dataRoot`)
Inspect repository resolvers, backend selection, and JSON/Prisma parity.
- **Top OWASP risks to probe:**
  1. A01:2021 – Broken Access Control (repository access bypass when falling back to JSON).
  2. A03:2021 – Injection (Prisma delegate usage, user-supplied filters in `packages/platform-core/src/repositories/inventory.server.ts`).
  3. A08:2021 – Software and Data Integrity Failures (repo switching via envs in `packages/platform-core/src/repositories/repoResolver.ts`).
  4. A05:2021 – Security Misconfiguration (data root resolution in `packages/platform-core/src/dataRoot.ts`).
  5. A09:2021 – Security Logging & Monitoring Failures (lack of audit when repository fails over).
- **Start with files:**
  - `packages/platform-core/src/repositories/inventory.server.ts`
  - `packages/platform-core/src/repositories/shop.server.ts`
  - `packages/platform-core/src/repositories/repoResolver.ts`
  - `packages/platform-core/src/dataRoot.ts`
  - `packages/platform-core/src/db.ts`

### S5 – Platform services & webhooks (`packages/platform-core/src/services`, `webhookHandlers`)
Check stock alerts, analytics, email dispatch, and webhook handling.
- **Top OWASP risks to probe:**
  1. A05:2021 – Security Misconfiguration (webhook endpoints requiring secret verification in `packages/platform-core/src/webhookHandlers/**`).
  2. A10:2021 – Server-Side Request Forgery (outbound webhook/post requests in `packages/platform-core/src/services/stockAlert.server.ts`).
  3. A08:2021 – Software and Data Integrity Failures (email/analytics side effects).
  4. A01:2021 – Broken Access Control (ensuring services respect shop scoping and roles).
  5. A09:2021 – Security Logging & Monitoring Failures (alert logging & retries).
- **Start with files:**
  - `packages/platform-core/src/handleStripeWebhook.ts`
  - `packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts`
  - `packages/platform-core/src/services/stockAlert.server.ts`
  - `packages/platform-core/src/services/emailService.ts`
  - `packages/platform-core/src/analytics/index.ts`

### S6 – Payments & upgrades pipeline (Stripe + worker)
Covers Stripe client usage, refunds, and shop upgrade automation.
- **Top OWASP risks to probe:**
  1. A07:2021 – Identification and Authentication Failures (Stripe secret usage in `packages/stripe/src/index.ts`).
  2. A08:2021 – Software and Data Integrity Failures (child process builds in `apps/api/src/routes/shop/[id]/publish-upgrade.ts`).
  3. A05:2021 – Security Misconfiguration (mock mode toggles, error logging around payments).
  4. A01:2021 – Broken Access Control (Bearer token validation in `apps/api/src/routes/components/[shopId].ts`).
  5. A10:2021 – Server-Side Request Forgery (Stripe webhook and upgrade flows retrieving remote resources).
- **Start with files:**
  - `packages/stripe/src/index.ts`
  - `packages/platform-machine/src/releaseDepositsService.ts`
  - `apps/api/src/routes/shop/[id]/publish-upgrade.ts`
  - `apps/api/src/routes/components/[shopId].ts`
  - `packages/platform-core/src/webhookHandlers/paymentIntentSucceeded.ts`

### S7 – Email & notification stack (`packages/email`, alerts)
Includes marketing providers and operational notifications.
- **Top OWASP risks to probe:**
  1. A10:2021 – Server-Side Request Forgery (SendGrid/Resend fetch calls in providers).
  2. A02:2021 – Cryptographic Failures (API key handling in `packages/email/src/providers/sendgrid.ts`).
  3. A08:2021 – Software and Data Integrity Failures (marketing stats aggregation).
  4. A01:2021 – Broken Access Control (ensuring CLI/email endpoints restrict recipients and templates).
  5. A09:2021 – Security Logging & Monitoring Failures (error handling + retries).
- **Start with files:**
  - `packages/email/src/providers/sendgrid.ts`
  - `packages/email/src/providers/resend.ts`
  - `packages/email/src/cli.ts`
  - `packages/platform-core/src/services/stockAlert.server.ts`
  - `packages/email/src/config.ts`

### S8 – Configuration & secrets enforcement (`packages/config`, root config)
Validate env parsing, defaults, and middleware security headers.
- **Top OWASP risks to probe:**
  1. A05:2021 – Security Misconfiguration (schema defaults vs. prod requirements in `packages/config/src/env/core.ts`).
  2. A02:2021 – Cryptographic Failures (ensuring secrets like `CART_COOKIE_SECRET` enforced).
  3. A04:2021 – Insecure Design (feature toggles enabling risky fallbacks).
  4. A08:2021 – Software and Data Integrity Failures (automatic env normalization logic).
  5. A06:2021 – Vulnerable and Outdated Components (dependencies defined in `package.json`).
- **Start with files:**
  - `packages/config/src/env/core.ts`
  - `docs/.env.reference.md`
  - `middleware.ts`
  - `next.config.mjs`
  - `package.json`

### S9 – Scheduled jobs & background workers (`functions`, `platform-machine`)
Covers cron-executed tasks, deposit release, maintenance services.
- **Top OWASP risks to probe:**
  1. A08:2021 – Software and Data Integrity Failures (automated refunds & blog publishing in `packages/platform-machine/src/releaseDepositsService.ts`, `functions/src/publishEditorial.ts`).
  2. A10:2021 – Server-Side Request Forgery (SEO audit fetches and webhook posts in `functions/src/seoAudit.ts`).
  3. A05:2021 – Security Misconfiguration (env toggles controlling job execution).
  4. A01:2021 – Broken Access Control (ensuring jobs respect per-shop authorization and fail safely).
  5. A09:2021 – Security Logging & Monitoring Failures (cron error logging + retries).
- **Start with files:**
  - `functions/src/seoAudit.ts`
  - `functions/src/publishEditorial.ts`
  - `packages/platform-machine/src/releaseDepositsService.ts`
  - `packages/platform-machine/src/startReverseLogisticsService.ts`
  - `packages/platform-machine/src/maintenanceScheduler.ts`

### S10 – Operator & automation scripts (`scripts/src`)
Focus on CLI entry points that manipulate shops and call APIs.
- **Top OWASP risks to probe:**
  1. A03:2021 – Injection (shell/process spawning in scaffolding scripts like `scripts/src/init-shop.ts`).
  2. A01:2021 – Broken Access Control (lack of auth when hitting CMS endpoints in `scripts/src/inventory.ts`).
  3. A05:2021 – Security Misconfiguration (env fallback logic in CLI helpers).
  4. A08:2021 – Software and Data Integrity Failures (file writes to `data/shops`).
  5. A09:2021 – Security Logging & Monitoring Failures (operator visibility of failures).
- **Start with files:**
  - `scripts/src/init-shop.ts`
  - `scripts/src/inventory.ts`
  - `scripts/src/generate-shop.ts`
  - `scripts/src/quickstart-shop.ts`
  - `scripts/src/release-deposits.ts`

### S11 – Cloudflare worker APIs (`apps/api`)
Ensure upgrade/preview routes securely operate on repo data.
- **Top OWASP risks to probe:**
  1. A01:2021 – Broken Access Control (token validation + shop ID handling in `apps/api/src/routes/components/[shopId].ts`).
  2. A03:2021 – Injection (command execution and JSON writes in `apps/api/src/routes/shop/[id]/publish-upgrade.ts`).
  3. A08:2021 – Software and Data Integrity Failures (filesystem mutations & pnpm builds).
  4. A05:2021 – Security Misconfiguration (secret management for `UPGRADE_PREVIEW_TOKEN_SECRET`).
  5. A09:2021 – Security Logging & Monitoring Failures (worker logging + Cloudflare observability).
- **Start with files:**
  - `apps/api/src/routes/components/[shopId].ts`
  - `apps/api/src/routes/shop/[id]/publish-upgrade.ts`
  - `apps/api/src/routes/shop/[id]/run.ts`
  - `apps/api/src/routes/components/__tests__/authorization.test.ts`
  - `wrangler.toml`
