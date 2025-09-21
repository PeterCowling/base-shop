import { describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { updatePage } from "../update";

jest.mock("@acme/types", () => ({
  historyStateSchema: { parse: (v: any) => v ?? {} },
}), { virtual: true });
jest.mock("@acme/types/src/index", () => ({
  historyStateSchema: { parse: (v: any) => v ?? {} },
}), { virtual: true });

jest.mock("../../common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { email: "user@example.com" } }),
}));

jest.mock("../service", () => ({
  getPages: jest.fn(),
  updatePage: jest.fn(),
}));

jest.mock("@/utils/sentry.server", () => ({ captureException: jest.fn() }));
jest.mock("@acme/config/env/core", () => ({ coreEnv: { NODE_ENV: "test" } }));

const service = jest.requireMock("../service") as {
  getPages: Mock;
  updatePage: Mock;
};

describe("updatePage", () => {
  it("returns errors when publishing without a slug", async () => {
    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("updatedAt", "now");
    fd.set("slug", "");
    fd.set("status", "published");
    fd.set("components", "[]");
    const result = await updatePage("shop", fd);
    expect(result.errors).toBeDefined();
    expect(service.updatePage).not.toHaveBeenCalled();
  });

  it("updates page on success", async () => {
    const prev = { id: "p1", updatedAt: "now", slug: "a" } as any;
    service.getPages.mockResolvedValue([prev]);
    service.updatePage.mockImplementation((_s: string, p: any) => Promise.resolve(p));
    const fd = new FormData();
    fd.set("id", "p1");
    fd.set("updatedAt", "now");
    fd.set("slug", "b");
    fd.set("components", "[]");
    fd.set("status", "draft");
    const result = await updatePage("shop", fd);
    expect(result.page?.slug).toBe("b");
    expect(service.updatePage).toHaveBeenCalled();
  });
});
