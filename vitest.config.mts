import path from 'node:path';

import { defineConfig, defineProject } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const storybookDir = path.resolve(__dirname, 'apps/storybook/.storybook');

export default defineConfig({
  test: {
    projects: [
      defineProject({
        plugins: [
          storybookTest({
            configDir: storybookDir,
            storybookScript: 'pnpm --filter @apps/storybook run dev -- --ci',
            storybookUrl: 'http://localhost:6006',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
                launch: { headless: true },
              },
            ],
          },
          setupFiles: [path.join(storybookDir, 'vitest.setup.ts')],
          coverage: {
            provider: 'v8',
            reportsDirectory: path.resolve(__dirname, 'coverage/storybook'),
            reporter: ['text', 'html'],
            watermarks: {
              statements: [50, 80],
            },
          },
        },
      }),
    ],
  },
});
