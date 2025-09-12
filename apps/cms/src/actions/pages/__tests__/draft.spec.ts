import { describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { savePageDraft } from "../draft";

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
  savePage: jest.fn(),
}));

jest.mock("@/utils/sentry.server", () => ({ captureException: jest.fn() }));
jest.mock("ulid", () => ({ ulid: () => "generated-ulid" }));
jest.mock("@acme/date-utils", () => ({ nowIso: () => "now" }));

const service = jest.requireMock("../service") as {
  getPages: Mock;
  savePage: Mock;
};

describe("savePageDraft", () => {
  it("returns error for invalid components", async () => {
    const fd = new FormData();
    fd.set("components", "oops");
    const result = await savePageDraft("shop", fd);
    expect(result.errors?.components[0]).toBe("Invalid components");
    expect(service.savePage).not.toHaveBeenCalled();
  });

  it("creates new draft when valid", async () => {
    service.getPages.mockResolvedValue([]);
    service.savePage.mockImplementation((_s: string, p: any) => Promise.resolve(p));
    const fd = new FormData();
    fd.set("components", "[]");
    const result = await savePageDraft("shop", fd);
    expect(result.page?.id).toBe("generated-ulid");
    expect(service.savePage).toHaveBeenCalled();
  });
});
