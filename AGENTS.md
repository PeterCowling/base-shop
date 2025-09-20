# AGENTS — Repo Runbook

## Core Workflow
- Install dependencies: `pnpm install`.
- Build all packages before starting any app: `pnpm -r build`.
- Regenerate config stubs after editing `packages/config/src/env/*.impl.ts`:
  - `pnpm --filter @acme/config run build:stubs`
- TypeScript path mapping: apps must map workspace packages to both `src` and `dist` so imports resolve pre/post build. See `docs/tsconfig-paths.md` for examples.

## Troubleshooting
- If `pnpm run dev` fails with an `array.length` error, use the Codex CLI failure log command to retrieve detailed logs and stack traces for the failing step.

## File Boundaries
- Keep each file focused on a single responsibility.
- Target ≤350 lines per file. If you must exceed this (e.g., generated output or framework-mandated structure), document the reason and plan a follow-up refactor.
- Prefer extracting helpers/components/modules over growing a single file.

## Security Work
- When performing security reviews or fixes, follow `security/AGENTS.md`.
  - Summary: prioritize externally reachable surfaces, authn/z, secrets, injections, deserialization, file handling, network/SSRF, path traversal, uploads, crypto, headers (CSP/CORS), CI/CD, IaC/cloud config. Provide runnable proofs via tests when possible. Keep all outputs local. For each finding include CWE/OWASP mapping, component path, risk, exploit narrative, minimal patch, and a test.

