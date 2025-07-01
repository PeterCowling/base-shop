import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel } from "node:worker_threads";
(globalThis as any).MessageChannel = MessageChannel;
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

process.env.NEXTAUTH_SECRET = "test-secret";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wizard-"));
  await fs.mkdir(path.join(dir, "packages"), { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("WizardPage", () => {
  it("renders notice and disabled form when no themes or templates", async () => {
    await withRepo(async () => {
      const { renderToStaticMarkup } = await import("react-dom/server");
      const { default: WizardPage } = await import(
        "../src/app/cms/wizard/page"
      );
      const html = renderToStaticMarkup(await WizardPage());
      expect(html).toContain("No themes available");
      expect(html).toContain("fieldset disabled");
    });
  });
});
