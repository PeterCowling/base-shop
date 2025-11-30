# Development

## Linting and local checks

- Run the repository linter locally before pushing:

  ```bash
  pnpm lint
  ```

- Pre-commit hooks (`simple-git-hooks` + `lint-staged`) already run ESLint on staged files with `--max-warnings=0`, so lint failures should be caught locally rather than in CI.

## Tests and CI gating

- Prefer running tests in CI rather than locally for day-to-day work:
  - Use app- or package-scoped commands when you do need local tests, e.g.:

    ```bash
    pnpm --filter @apps/cms test
    pnpm --filter @apps/skylar test
    ```

- CI workflows (`test.yml`, `ci.yml`, app-specific workflows) are responsible for running the full test suites (unit, integration, E2E) and acting as the main gate for merges and deploys.
