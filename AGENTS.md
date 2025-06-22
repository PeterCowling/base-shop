# AGENTS instructions

## Overview

This repo is a Next.js 15 demo shop written in TypeScript. All source lives under `src/`. Use Node.js 20+ and pnpm for all tasks.

## Useful commands

- `pnpm install` – install dependencies
- `pnpm dev` – start the dev server
- `pnpm lint` – run ESLint and Prettier
- `pnpm test` – run Jest unit tests
- `pnpm e2e` – run Playwright E2E suite
- `pnpm build` – create a production build
- `pnpm preview` – preview via Wrangler

## Checks required before committing

Run the following before sending a pull request:

```bash
pnpm lint
pnpm test
```

If either command fails include the output in your PR message.

## Conventions

- Use TypeScript with ES module syntax.
- Client components need `"use client"` at the top.
- Import from `@/` to reference files inside `src`.
- Tailwind CSS classes should match the config in `tailwind.config.ts`.
