Storybook wrapper app

- Uses the repo-level `.storybook` config for now.
- Run: `pnpm --filter @apps/storybook dev`
- Builder: pinned to Webpack 5 (`.storybook/main.ts`). We tried Vite and rolled it back; please do not switch builders without an explicit migration plan.
- Chromatic is placeholder only; do not run Chromatic uploads until an explicit migration task is opened.
- To migrate config into this app, move `.storybook` here and update the scripts to `-c ./.storybook`.
