# AGENTS

## Required scripts

- Run `pnpm install` to install dependencies.
- Build all packages before starting any app: `pnpm -r build`.
- Regenerate config stubs after editing `.impl.ts` files: `pnpm run build:stubs`.
- If `pnpm run dev` fails with an `array.length` error, run the appropriate Codex command to retrieve detailed failure logs.
- Apps must map workspace packages in their `tsconfig.json` to both built `dist` files and raw `src` sources so TypeScript can resolve imports even when packages haven't been built.

