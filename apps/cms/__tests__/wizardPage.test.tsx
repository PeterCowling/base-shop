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
  it("redirects to the configurator", async () => {
    await withRepo(async () => {
      const navigation = await import("next/navigation");
      const redirectSpy = navigation.redirect as jest.Mock;
      const { default: WizardPage } = await import(
        "../src/app/cms/wizard/page"
      );
      await WizardPage();
      expect(redirectSpy).toHaveBeenCalledWith("/cms/configurator");
    });
  });
});
