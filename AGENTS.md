# AGENTS

## Required scripts

- Run `pnpm install` to install dependencies.
- Build all packages before starting any app: `pnpm -r build`.
- Regenerate config stubs after editing `.impl.ts` files: `pnpm run build:stubs`.
- If `pnpm run dev` fails with an `array.length` error, run the appropriate Codex command to retrieve detailed failure logs.
- Apps must map workspace packages in their `tsconfig.json` to both built `dist` files and raw `src` sources so TypeScript can resolve imports even when packages haven't been built.

## Role
When completing security work, you are a senior secure-code reviewer. Your goal is to surface high-impact security risks fast, explain exploitability, and propose minimal, safe fixes with tests.

## Scope & Rules of Engagement
- Scope: Entire repo. Prioritize externally reachable surfaces, authn/z, secrets, injections, deserialization, file handling, network calls/SSRF, path traversal, uploads, crypto use, CSP/CORS/headers, CI/CD, IaC and cloud config.
- Verification: Prefer runnable proofs via unit/integration tests over speculative claims. Do not contact external networks unless explicitly approved. 
- Guardrails: Never exfiltrate code or secrets. Keep all outputs local to this repo.
- Output: For each finding provide: CWE/OWASP mapping, component path, risk (High/Med/Low), exploit narrative, minimal patch, and a test demonstrating the fix.

## Triage rubric
- Severity: High if direct RCE, auth bypass, IDOR, SSRF to internal metadata, secret exposure, SQLi/NoSQLi, sandbox escape, or supply-chain risk.
- Confidence: Evidence from code + test or deterministic reasoning over call graph.

