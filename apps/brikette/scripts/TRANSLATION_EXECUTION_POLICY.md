# Translation Execution Policy (S2-09)

## Status
- Effective date: 2026-02-09
- Scope: guide JSON translation runner work in Slice 2 (`translate-guides` tooling)

## Canonical policy
- Default execution mode is `fixture`/mock-provider for CI and local contract verification.
- External API-backed translation is optional and non-default.
- Manual in-house editing remains supported for production copy review and corrections.

This is intentionally dual-mode with an explicit safe default:
- Safe default: no network calls, no API keys, deterministic fixtures.
- Optional external mode: enabled only when a maintainer intentionally configures provider credentials and runtime flags.

## Provider contract

```ts
type TranslationProviderInput = {
  text: string;      // JSON string source payload
  locale: string;    // target locale, e.g. "it"
  context: {
    guideName: string;
    sourceLocale: string;       // usually "en"
    tokenPolicyVersion: "v1";   // token invariant contract
  };
};

interface TranslationProvider {
  id: string;
  translate(input: TranslationProviderInput): Promise<string>;
}
```

Provider output contract:
- Must return valid JSON text.
- Must preserve token invariants:
  - `%LINK:guideKey|anchor%` keeps `guideKey`
  - `%IMAGE:file|alt%` keeps `file`
  - `%COMPONENT:name%` keeps `name`

## Failure semantics
- `provider_error`: provider request failed or rejected.
- `invalid_source_json`: source payload is not parseable JSON.
- `invalid_translated_json`: provider output is not parseable JSON.
- `token_invariant_mismatch`: token signature counts changed between source and output.

These codes are the required surface for runner logs and CI diagnostics.

## Security and compliance guardrails
- Do not commit API keys or tokens into repo, scripts, or fixtures.
- Do not print secrets to stdout/stderr.
- Keep CI and default local checks on fixture provider mode.
- If external provider mode is used, run only in explicitly approved environments with least-privilege credentials.
- Preserve source JSON and token invariants before any write operation.

## Runtime implications
- Deterministic spike contract checks (default mode):
  - `cd apps/brikette && pnpm exec jest --ci --runInBand --config jest.config.cjs --runTestsByPath scripts/__tests__/translate-guides-spike.test.ts`
  - `pnpm --filter @apps/brikette exec tsx scripts/translate-guides-spike.ts`
- Existing `translate-guides.ts` remains legacy API-key based until S2-05 implementation replaces it with the generic provider runner.
