// cypress.config.ts
import { defineConfig } from "cypress";
import tsconfigPaths from "vite-tsconfig-paths";
import istanbul from "vite-plugin-istanbul";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import os from "node:os";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3006",
    // Run both `.cy.ts` and `.spec.ts` test files
    specPattern: [
      "cypress/e2e/**/*.cy.{js,ts}",
      "test/e2e/**/*.spec.{js,ts}"
    ],
    // Load global support commands
    supportFile: "cypress/support/index.ts",
    // Expose NextAuth secret to Cypress and tests
    env: {
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ||
        "test-nextauth-secret-32-chars-long-string!",
      TEST_DATA_ROOT: process.env.TEST_DATA_ROOT || "__tests__/data/shops"
    },
    defaultCommandTimeout: 10000,
    // Reduce flakes in CI without masking real failures in open mode
    retries: { runMode: 2, openMode: 0 },
    numTestsKeptInMemory: 1,
    videoCompression: 32,
    async setupNodeEvents(on, config) {
      // Enable test filtering by name/tags
      try {
        const { default: grepPlugin } = await import('cypress-grep/src/plugin.js');
        grepPlugin(config);
      } catch {}
      // Code coverage tasks
      try {
        const { default: codeCoverageTask } = await import('@cypress/code-coverage/task');
        codeCoverageTask(on, config);
      } catch {}
      // Image snapshot plugin
      try {
        const { addMatchImageSnapshotPlugin } = await import('cypress-image-snapshot/plugin');
        // @ts-ignore - types missing
        addMatchImageSnapshotPlugin(on, config);
      } catch {}
      // Lighthouse audits (optional)
      try {
        const { lighthouse, pa11y } = await import('cypress-audit/src/plugin');
        // @ts-ignore - types missing
        on('task', { lighthouse: lighthouse(), pa11y: pa11y() });
      } catch {}
      let tempDir: string | null = null;

      // After run, if COVERAGE=1, collect server coverage from Next via API
      on('after:run', async () => {
        if (process.env.COVERAGE !== '1') return;
        try {
          const { default: fetch } = await import('node-fetch');
          const base = config.baseUrl || 'http://localhost:3006';
          const res = await fetch(base.replace(/\/$/, '') + '/api/__coverage__');
          if (res.ok) {
            const json = await res.json();
            const out = join(process.cwd(), '.nyc_output');
            mkdirSync(out, { recursive: true });
            writeFileSync(join(out, 'server.coverage.json'), JSON.stringify(json));
          }
        } catch {}
      });

      on("task", {
        /** Simple logger to surface values from browser context */
        log(message: unknown) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
        /**
         * Create a temporary TEST_DATA_ROOT and seed minimal fixtures.
         * @param shop shop identifier (e.g. "demo")
         */
        "testData:setup"(shop: string) {
          const root = mkdtempSync(join(os.tmpdir(), "cypress-data-"));
          const src = join("__tests__", "data", "shops", shop);
          const dest = join(root, shop);
          mkdirSync(dest, { recursive: true });
          ["pages.json", "settings.json"].forEach((file) => {
            cpSync(join(src, file), join(dest, file));
          });
          tempDir = root;
          return root;
        },

        /** Remove the temporary TEST_DATA_ROOT created for tests. */
        "testData:cleanup"() {
          if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
            tempDir = null;
          }
          return null;
        }
      });

      return config;
    }
  }
  ,
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      // Use a Vite config tailored for CT with TS path aliases
      viteConfig: {
        plugins: [
          tsconfigPaths({ projects: ["apps/cms/tsconfig.json", "tsconfig.base.json"] }),
          istanbul({
            cypress: true,
            requireEnv: false,
            include: ["apps/cms/src/**/*"],
            exclude: ["**/*.cy.*", "**/__tests__/**", "**/*.test.*"]
          })
        ],
        resolve: {
          alias: {
            'next/navigation': resolvePath(process.cwd(), 'test/shims/next-navigation-ct.ts'),
            '@cms/actions/shops.server': resolvePath(process.cwd(), 'test/shims/cms-actions-seo.ts'),
            '@platform-core/repositories/settings.server': resolvePath(process.cwd(), 'test/shims/platform-settings-repo.ts')
          }
        }
      }
    },
    specPattern: [
      "apps/cms/src/**/*.cy.{ts,tsx}"
    ],
    supportFile: "cypress/support/component.ts",
    retries: { runMode: 2, openMode: 0 },
    setupNodeEvents: async (on, config) => {
      try {
        const { default: grepPlugin } = await import('cypress-grep/src/plugin.js');
        grepPlugin(config);
      } catch {}
      try {
        const { default: codeCoverageTask } = await import('@cypress/code-coverage/task');
        codeCoverageTask(on, config);
      } catch {}
      return config;
    }
  }
});
