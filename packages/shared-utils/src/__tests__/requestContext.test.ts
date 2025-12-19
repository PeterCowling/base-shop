import {
  getRequestContext,
  setRequestContext,
  withRequestContext,
} from "../requestContext";

const baseContext = {
  requestId: "req-1",
  env: "dev" as const,
  service: "shared-utils",
};

describe("requestContext", () => {
  afterEach(() => {
    setRequestContext(undefined);
  });

  it("sets and gets the current context", () => {
    setRequestContext(baseContext);
    expect(getRequestContext()).toEqual(baseContext);
  });

  it("restores the previous context after executing a callback", () => {
    const previous = { ...baseContext, requestId: "req-prev" };
    const next = { ...baseContext, requestId: "req-next", shopId: "shop-1" };

    setRequestContext(previous);

    const result = withRequestContext(next, () => {
      expect(getRequestContext()).toEqual(next);
      return "ok";
    });

    expect(result).toBe("ok");
    expect(getRequestContext()).toEqual(previous);
  });

  it("restores the previous context even when the callback throws", () => {
    const previous = { ...baseContext, requestId: "req-prev" };
    const next = { ...baseContext, requestId: "req-error" };

    setRequestContext(previous);

    expect(() =>
      withRequestContext(next, () => {
        throw new Error("boom");
      })
    ).toThrow("boom");

    expect(getRequestContext()).toEqual(previous);
  });
});
