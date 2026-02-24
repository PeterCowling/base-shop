import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const clearUploaderCookieMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  clearUploaderCookie: (...args: unknown[]) => clearUploaderCookieMock(...args),
}));

describe("uploader logout route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears cookie and returns ok response", async () => {
    const { POST } = await import("../route");
    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
    expect(clearUploaderCookieMock).toHaveBeenCalledTimes(1);
    expect(clearUploaderCookieMock).toHaveBeenCalledWith(expect.objectContaining({ status: 200 }));
  });
});
