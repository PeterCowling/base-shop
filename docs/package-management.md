Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2025-12-02

# Package Management

## Workspace layout
The monorepo uses **pnpm workspaces** to organize applications and shared packages. Patterns in `pnpm-workspace.yaml` include `apps/**` for app sources, `packages/**`, and special entries such as `packages/platform-machine` and `packages/plugins/sanity`.

## Turbo tasks
[Turborepo](https://turbo.build) coordinates common tasks across the workspace. The `turbo.json` config defines pipelines for `dev`, `build`, `lint`, and `test`, enabling caching and dependency-aware execution.

## Scripts
Use these `package.json` scripts for day‑to‑day development:

- `pnpm dev` – runs `turbo run dev --parallel` to start all apps in development. Build packages first with `pnpm -r build`.
- `pnpm build` – cleans and builds every package, regenerates tokens, and checks the Tailwind preset.
- `pnpm lint` – runs lint rules on all projects.
- `pnpm test` – executes unit tests. Prefer scoping: `pnpm --filter <workspace> test`. Avoid monorepo‑wide runs unless necessary.
- `pnpm quickstart-shop` – scaffolds a new shop with optional seeding for rapid demos.

## Reproducible builds
The workspace pins transitive dependencies via `pnpm` **overrides** and compiles a curated list of native modules listed in `onlyBuiltDependencies`. These settings ensure consistent, reproducible builds across environments.
