# Guide Translation Runner

Canonical policy lives in `scripts/TRANSLATION_EXECUTION_POLICY.md`.

## Overview

`translate-guides.ts` is now a generic runner that supports pluggable providers and token-safety invariants.

- Default provider mode: `fixture` (deterministic, no network).
- Optional provider mode: `anthropic` (explicit opt-in).
- Token invariants are enforced for:
  - `%LINK:guideKey|anchor%` (`guideKey` must not change)
  - `%IMAGE:file|alt%` (`file` must not change)
  - `%COMPONENT:name%` (`name` must not change)

## Default workflow (safe, deterministic)

```bash
cd apps/brikette

# Contract tests
pnpm exec jest --ci --runInBand --config jest.config.cjs \
  --runTestsByPath scripts/__tests__/translate-guides-runner.test.ts \
  scripts/__tests__/translate-guides-spike.test.ts

# Spike parity matrix
pnpm run translate-guides:spike
```

## Runner usage

```bash
cd apps/brikette
pnpm exec tsx scripts/translate-guides.ts \
  --provider=fixture \
  --fixture-file=/absolute/path/to/fixtures.json \
  --guides=historyPositano.json,folkloreAmalfi.json \
  --locales=it,fr \
  --dry-run
```

To write files, pass `--write` (default is `--dry-run`):

```bash
pnpm exec tsx scripts/translate-guides.ts \
  --provider=fixture \
  --fixture-file=/absolute/path/to/fixtures.json \
  --guides=historyPositano.json \
  --locales=it \
  --write
```

To use Anthropic explicitly:

```bash
export ANTHROPIC_API_KEY=...
pnpm exec tsx scripts/translate-guides.ts \
  --provider=anthropic \
  --guides=historyPositano.json \
  --locales=it \
  --write
```

## CLI options

- `--provider=fixture|anthropic`
- `--fixture-file=<absolute-path>` (required for `fixture`)
- `--guides=a.json,b.json`
- `--locales=it,fr`
- `--source-root=<path>` (default `apps/brikette/src/locales`)
- `--output-root=<path>` (default `apps/brikette/src/locales`)
- `--source-locale=<locale>` (default `en`)
- `--content-dir=<relative-dir>` (default `guides/content`)
- `--dry-run` (default)
- `--write` (overrides `--dry-run`)
- `--allow-failures` (does not set exit code 1 on per-locale failures)

## Fixture file format

JSON object keyed by `<locale>:<guideName>` with JSON-string payload values.
Wildcard locale fixtures are supported via `<locale>:*`.

Example:

```json
{
  "it:historyPositano.json": "{\"title\":\"...\"}",
  "fr:*": "{\"title\":\"fallback\"}"
}
```

## Validation commands after writes

```bash
pnpm run validate-content --fail-on-violation
pnpm run validate-links
pnpm run check-i18n-coverage
```
