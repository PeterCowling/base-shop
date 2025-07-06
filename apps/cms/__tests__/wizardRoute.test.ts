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

describe("wizard route", () => {
  it("renders wizard page for admin", async () => {
    jest.resetModules();
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: WizardPage } = await import("../src/app/cms/wizard/page");
    const html = renderToStaticMarkup(await WizardPage());
    expect(html).toContain("Create Shop");
  });
});
