import { defineConfig } from "cypress";
import { encode as nextAuthEncode } from "next-auth/jwt";
import tsconfigPaths from "vite-tsconfig-paths";
import istanbul from "vite-plugin-istanbul";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = resolvePath(__dirname, "../..");
const mswServerOut = resolvePath(repoRoot, "dist/msw/test/msw/server.js");
const mswFlowsOut = resolvePath(repoRoot, "dist/msw/test/msw/flows.js");
const axeLogPath = resolvePath(repoRoot, "cypress/logs/axe.log");
mkdirSync(resolvePath(repoRoot, "cypress/logs"), { recursive: true });
const log = (...args) => console.log("[cms:cypress.config]", ...args);

log("loaded config entry", {
  nodeVersion: process.version,
  cwd: process.cwd(),
  repoRoot,
  nodeOptions: process.env.NODE_OPTIONS || "",
});

function patchRelativeImports(filePath) {
  const source = readFileSync(filePath, "utf8");
  const patched = source.replace(/from\s+(["'])(\.\/[^."']+)\1/g, (_match, quote, spec) => `from ${quote}${spec}.js${quote}`);
  if (patched !== source) {
    writeFileSync(filePath, patched, "utf8");
    log("patched relative imports", { filePath });
  }
}

function buildMswHelpers() {
  const tscBin = resolvePath(repoRoot, "node_modules", "typescript", "bin", "tsc");
  const tsconfigPath = resolvePath(repoRoot, "tsconfig.msw.json");
  const env = { ...process.env };
  const nodeOptionsOriginal = env.NODE_OPTIONS;
  delete env.NODE_OPTIONS;
  const startedAt = Date.now();
  log("compiling MSW helpers", { tscBin, tsconfigPath, nodeOptionsOriginal });
  const result = spawnSync(process.execPath, [tscBin, "-p", tsconfigPath], {
    stdio: "inherit",
    cwd: repoRoot,
    env,
  });
  if (result.status !== 0) {
    log("tsc output", { status: result.status, signal: result.signal });
    throw new Error("Failed to compile MSW helpers via tsconfig.msw.json");
  }
  log("compiled MSW helpers", { durationMs: Date.now() - startedAt });
  [mswServerOut, mswFlowsOut].forEach(patchRelativeImports);
}

buildMswHelpers();

log("loading compiled MSW helpers", { mswServerOut, mswFlowsOut });
const mswServerModulePromise = import(pathToFileURL(mswServerOut).href);
const mswFlowsModulePromise = import(pathToFileURL(mswFlowsOut).href);

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3006",
    specPattern: [
      join(__dirname, "cypress/e2e/**/*.cy.{js,ts,tsx}"),
      join(path.resolve(__dirname, "../../test/e2e/**/*.spec.{js,ts}")),
    ],
    supportFile: join(__dirname, "cypress/support/index.ts"),
    env: {
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ||
        "dev-nextauth-secret-32-chars-long-string!",
      TEST_DATA_ROOT: process.env.TEST_DATA_ROOT || "__tests__/data/shops",
      SHOP: process.env.CYPRESS_SHOP || "demo",
      SHOP_ALT: process.env.CYPRESS_SHOP_ALT || "bcd",
    },
    defaultCommandTimeout: 10000,
    retries: { runMode: 2, openMode: 0 },
    numTestsKeptInMemory: 1,
    videoCompression: 32,
    async setupNodeEvents(on, config) {
      const [{ server }, { handlersLoginAs, handlersCheckoutHappyPath }] = await Promise.all([
        mswServerModulePromise,
        mswFlowsModulePromise,
      ]);
      try {
        const { default: grepPlugin } = await import("@cypress/grep/src/plugin.js");
        grepPlugin(config);
      } catch {}
      try {
        const { default: codeCoverageTask } = await import("@cypress/code-coverage/task");
        codeCoverageTask(on, config);
      } catch {}
      try {
        const { addMatchImageSnapshotPlugin } = await import("@acme/cypress-image-snapshot/plugin");
        addMatchImageSnapshotPlugin(on, config);
      } catch {}
      try {
        const { lighthouse, pa11y } = await import("cypress-audit/src/plugin");
        on("task", { lighthouse: lighthouse(), pa11y: pa11y() });
      } catch {}
      let tempDir = null;

      on("after:run", async () => {
        if (process.env.COVERAGE !== "1") return;
        try {
          const { default: fetch } = await import("node-fetch");
          const base = config.baseUrl || "http://localhost:3006";
          const res = await fetch(base.replace(/\/$/, "") + "/api/__coverage__");
          if (res.ok) {
            const json = await res.json();
            const out = join(process.cwd(), ".nyc_output");
            mkdirSync(out, { recursive: true });
            writeFileSync(join(out, "server.coverage.json"), JSON.stringify(json));
          }
        } catch {}
      });

      on("task", {
        log(message) {
          const line = typeof message === "string" ? message : JSON.stringify(message);
          console.log(line);
          appendFileSync(axeLogPath, `${new Date().toISOString()} ${line}\n`, "utf8");
          return null;
        },
        async "auth:token"(role = "admin") {
          const secret = config.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET;
          if (!secret) throw new Error("NEXTAUTH_SECRET is required for auth:token task");
          return nextAuthEncode({
            token: {
              role,
              email: `${role}@example.com`,
              name: role,
              sub: role === "admin" ? "1" : "2",
            },
            secret,
          });
        },
        "testData:setup"(shop) {
          const root = mkdtempSync(join(os.tmpdir(), "cypress-data-"));
          const src = join(repoRoot, "__tests__", "data", "shops", shop);
          const dest = join(root, shop);
          mkdirSync(dest, { recursive: true });
          ["pages.json", "settings.json"].forEach((file) => {
            cpSync(join(src, file), join(dest, file));
          });
          tempDir = root;
          return root;
        },
        "testData:cleanup"() {
          if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
            tempDir = null;
          }
          return null;
        },
        "msw:start"() {
          server.listen({ onUnhandledRequest: "error" });
          return null;
        },
        "msw:reset"() {
          server.resetHandlers();
          return null;
        },
        "msw:close"() {
          server.close();
          return null;
        },
        "msw:loginAs"(role) {
          server.use(...handlersLoginAs(role));
          return null;
        },
        "msw:checkout"() {
          server.use(...handlersCheckoutHappyPath());
          return null;
        },
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: {
        plugins: [
          tsconfigPaths({
            projects: [
              resolvePath(repoRoot, "apps/cms/tsconfig.json"),
              resolvePath(repoRoot, "apps/dashboard/tsconfig.json"),
              resolvePath(repoRoot, "tsconfig.base.json"),
            ],
          }),
          istanbul({
            cypress: true,
            requireEnv: false,
            include: ["apps/cms/src/**/*"],
            exclude: ["**/*.cy.*", "**/__tests__/**", "**/*.test.*"],
          }),
        ],
        resolve: {
          alias: {
            "next/navigation": resolvePath(repoRoot, "test/shims/next-navigation-ct.tsx"),
            "next/router": resolvePath(repoRoot, "test/shims/next-router-ct.ts"),
            "next/link": resolvePath(repoRoot, "test/mocks/next-link.tsx"),
            "~test": resolvePath(repoRoot, "test"),
            "@cms/actions/shops.server": resolvePath(repoRoot, "test/shims/cms-actions-seo.ts"),
            "@platform-core/repositories/settings.server": resolvePath(repoRoot, "test/shims/platform-settings-repo.ts"),
          },
        },
      },
    },
    specPattern: [
      join(repoRoot, "apps/cms/src/**/*.cy.{ts,tsx}"),
      join(repoRoot, "apps/dashboard/src/**/*.cy.{ts,tsx}"),
    ],
    supportFile: join(__dirname, "cypress/support/component.tsx"),
    retries: { runMode: 2, openMode: 0 },
    async setupNodeEvents(on, config) {
      try {
        const { default: grepPlugin } = await import("@cypress/grep/src/plugin.js");
        grepPlugin(config);
      } catch {}
      try {
        const { default: codeCoverageTask } = await import("@cypress/code-coverage/task");
        codeCoverageTask(on, config);
      } catch {}
      return config;
    },
  },
});
