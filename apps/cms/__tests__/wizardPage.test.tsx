// apps/cms/__tests__/wizardPage.test.tsx
/* eslint-env jest */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/* -------------------------------------------------------------------------- */
/*  Minimal env & auth/navigation stubs                                       */
/* -------------------------------------------------------------------------- */
process.env.NEXTAUTH_SECRET = "test-secret";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

/* -------------------------------------------------------------------------- */
/*  Stub `@platform-core` so AppShell can import without crashing         */
/* -------------------------------------------------------------------------- */
jest.mock("@platform-core", () => {
  const React = require("react");
  return {
    __esModule: true,
    // pass-through providers – simply render children
    LayoutProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    // hook returning *any* value the component tree might expect
    useLayout: () => ({ layout: "default" }),
  };
});

/* -------------------------------------------------------------------------- */
/*  Helper: create an isolated temp repo so filesystem lookups don’t fail     */
/* -------------------------------------------------------------------------- */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wizard-"));
  await fs.mkdir(path.join(dir, "packages"), { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules(); // purge previous module state
  await import("../../../test/resetNextMocks");

  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

/* -------------------------------------------------------------------------- */
/*  The actual test                                                           */
/* -------------------------------------------------------------------------- */
describe("WizardPage", () => {
  it("renders placeholder content", async () => {
    await withRepo(async () => {
      // Ensure React is loaded before invoking the server renderer.  In some
      // environments Jest’s module cache can be cleared which leaves React
      // undefined when `react-dom/server` evaluates.
      await import("react");
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { default: WizardPage } = await import(
        "../src/app/cms/wizard/page"
      );

      const html = renderToStaticMarkup(await WizardPage());

      expect(html).toContain("Shop Details");
    });
  });
});
