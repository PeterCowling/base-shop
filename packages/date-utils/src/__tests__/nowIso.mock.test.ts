import { jest } from "@jest/globals";

describe("nowIso mockability", () => {
  it("returns mocked value", async () => {
    const fixed = "2020-01-01T00:00:00.000Z";
    jest.resetModules();
    jest.doMock("../index", () => ({
      __esModule: true,
      ...jest.requireActual("../index"),
      nowIso: () => fixed,
    }));
    const { nowIso } = await import("../index");
    expect(nowIso()).toBe(fixed);
  });
});
