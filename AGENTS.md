# AGENTS — Repo Runbook

Use this file as the global checklist for working in the Skylar SRL monorepo. Locale-specific visual systems and tone of voice live in:

- `apps/skylar/AGENTS.en.md` — warm red on cream "poster" system for EN.
- `apps/skylar/AGENTS.it.md` — Milan editorial guidelines.
- `apps/skylar/AGENTS.zh.md` — gold-on-black business card system for ZH.

Always cross-check the relevant locale doc before touching copy, layout, or imagery inside `apps/skylar`.

## Core Workflow
- Install dependencies: `pnpm install`.
- Build all packages before starting any app: `pnpm -r build`.
- Regenerate config stubs after editing `packages/config/src/env/*.impl.ts`:
  - `pnpm --filter @acme/config run build:stubs`
- TypeScript path mapping: apps must map workspace packages to both `src` and `dist` so imports resolve pre/post build. See `docs/tsconfig-paths.md` for examples.

## Troubleshooting
- If `pnpm run dev` fails with an `array.length` error, see `docs/troubleshooting.md` for steps to capture detailed logs and stack traces.

## File Boundaries
- Keep each file focused on a single responsibility.
- Target ≤350 lines per file. If you must exceed this (e.g., generated output or framework-mandated structure), document the reason and plan a follow-up refactor.
- Prefer extracting helpers/components/modules over growing a single file.

## Security Work
- When performing security reviews or fixes, follow `security/AGENTS.md`.
  - Summary: prioritize externally reachable surfaces, authn/z, secrets, injections, deserialization, file handling, network/SSRF, path traversal, uploads, crypto, headers (CSP/CORS), CI/CD, IaC/cloud config. Provide runnable proofs via tests when possible. Keep all outputs local. For each finding include CWE/OWASP mapping, component path, risk, exploit narrative, minimal patch, and a test.

## Testing Policy
- Do not run package- or app-wide test suites across the monorepo unless explicitly asked. These runs are expensive and slow down iteration.
- Prefer scoped runs:
  - Single package: `pnpm --filter <workspace> test`
  - Single file or pattern (Jest): `pnpm --filter <workspace> test -- --testPathPattern <pattern>`
  - Cypress subset: `pnpm e2e:dashboard` or tag/grep focused specs
- For coverage, run targeted commands only when needed (see `docs/coverage.md`).
