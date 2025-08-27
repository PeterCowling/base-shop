# AGENTS

This package exposes configuration files through generated JavaScript stubs.
Each config file has a TypeScript implementation in a sibling `*.impl.ts`
file. The corresponding `*.js` stub simply re-exports the compiled
implementation.

## Regenerating stubs

Run `pnpm run build:stubs` whenever a `*.impl.ts` file changes to rebuild the
JavaScript stubs.

## Tooling

- **Next.js** loads the `*.js` stubs for runtime configuration.
- **Jest** resolves the stubs so tests run without a custom transformer.
- **ESLint** reads configuration from the stubs for consistent linting.

