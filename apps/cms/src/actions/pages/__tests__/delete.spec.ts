import { describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";

import { deletePage } from "../delete";

jest.mock("../../common/auth", () => ({
  ensureAuthorized: jest.fn<Promise<{ user: { email: string } }>, []>().mockResolvedValue({ user: { email: "user@example.com" } }),
}));

jest.mock("../service", () => ({
  deletePage: jest.fn(),
}));

jest.mock("@/utils/sentry.server", () => ({ captureException: jest.fn() }));

const service = jest.requireMock("../service") as {
  deletePage: Mock<any, any>;
};

describe("deletePage", () => {
  it("calls service on success", async () => {
    service.deletePage.mockResolvedValue(undefined);
    await deletePage("shop", "p1");
    expect(service.deletePage).toHaveBeenCalledWith("shop", "p1");
  });

  it("captures and rethrows errors", async () => {
    const err = new Error("boom");
    service.deletePage.mockRejectedValue(err);
    await expect(deletePage("shop", "p1")).rejects.toThrow("boom");
  });
});
