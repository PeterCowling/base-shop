# Contributing

Contributions are welcome! Please open an issue or pull request with improvements.

## Formatting

Use [pnpm](https://pnpm.io) for package management. The repository uses Prettier and ESLint with semicolons, double quotes, two-space indentation, an 80-character line width, and the Tailwind CSS plugin. Run [`pnpm lint`](../package.json#L24) to check formatting and lint rules, or [`pnpm format`](../package.json#L37) to automatically apply fixes.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Start messages with a type such as `feat:` or `fix:` and write in the present tense with a concise subject line under 72 characters.

## Branching

Create branches from `main` and name them descriptively (e.g., `feat/login-form` or `fix/cart-redirect`). Push your branch and open a pull request against `main`.

## Linting and Tests

Before submitting changes, run [`pnpm lint`](../package.json#L24) and [`pnpm test`](../package.json#L28) to ensure the codebase is formatted correctly and the test suite passes.

