const applyMock = jest.fn();

jest.mock("../zodErrorMap.js", () => ({
  applyFriendlyZodMessages: applyMock,
  friendlyErrorMap: {},
}));

describe("package index", () => {
  beforeEach(() => {
    jest.resetModules();
    applyMock.mockClear();
  });

  test("invokes applyFriendlyZodMessages on import and when calling initZod()", async () => {
    const mod = await import("../index");
    expect(applyMock).toHaveBeenCalledTimes(1);

    mod.initZod();
    expect(applyMock).toHaveBeenCalledTimes(2);

    // Touch re-exports to exercise re-export getters for coverage
    expect(typeof mod.applyFriendlyZodMessages).toBe("function");
    expect(mod.friendlyErrorMap).toBeDefined();
  });
});
