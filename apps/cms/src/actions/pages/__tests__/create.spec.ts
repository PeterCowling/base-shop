import { describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { createPage } from "../create";

jest.mock("../../common/auth", () => ({
  ensureAuthorized: jest.fn().mockResolvedValue({ user: { email: "user@example.com" } }),
}));

jest.mock("../service", () => ({
  getPages: jest.fn(),
  savePage: jest.fn(),
}));

jest.mock("@/utils/sentry.server", () => ({ captureException: jest.fn() }));
jest.mock("ulid", () => ({ ulid: () => "generated-ulid" }));
jest.mock("@acme/date-utils", () => ({ nowIso: () => "now" }));
jest.mock("@acme/config/env/core", () => ({ coreEnv: { NODE_ENV: "test" } }));

const service = jest.requireMock("../service") as {
  getPages: Mock;
  savePage: Mock;
};

describe("createPage", () => {
  it("returns errors on validation failure", async () => {
    const fd = new FormData();
    fd.set("slug", "home");
    fd.set("components", "not-json");
    const result = await createPage("shop", fd);
    expect(result.errors).toBeDefined();
    expect(service.savePage).not.toHaveBeenCalled();
  });

  it("saves page on success", async () => {
    service.getPages.mockResolvedValue([]);
    service.savePage.mockImplementation((_s: string, p: any) => Promise.resolve(p));
    const fd = new FormData();
    fd.set("slug", "home");
    fd.set("components", "[]");
    const result = await createPage("shop", fd);
    expect(result.page?.id).toBe("generated-ulid");
    expect(service.savePage).toHaveBeenCalled();
  });
});
