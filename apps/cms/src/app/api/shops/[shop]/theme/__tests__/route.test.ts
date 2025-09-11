import { NextRequest } from "next/server";

const patchTheme = jest.fn();

jest.mock("@cms/services/shops", () => ({ patchTheme }));

let PATCH: typeof import("../route").PATCH;

beforeAll(async () => {
  ({ PATCH } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(body: any) {
  return new NextRequest("http://test.local", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH", () => {
  it("updates theme via service", async () => {
    patchTheme.mockResolvedValue({ shop: "s1" });
    const res = await PATCH(
      req({ themeOverrides: { color: "blue" }, themeDefaults: {} }),
      { params: Promise.resolve({ shop: "s1" }) },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ shop: "s1" });
    expect(patchTheme).toHaveBeenCalledWith("s1", {
      themeOverrides: { color: "blue" },
      themeDefaults: {},
    });
  });

  it("handles null body", async () => {
    patchTheme.mockResolvedValue({ shop: "s1" });
    const nullReq = new NextRequest("http://test.local", {
      method: "PATCH",
      body: "null",
      headers: { "content-type": "application/json" },
    });
    await PATCH(nullReq, { params: Promise.resolve({ shop: "s1" }) });
    expect(patchTheme).toHaveBeenCalledWith("s1", {
      themeOverrides: undefined,
      themeDefaults: undefined,
    });
  });

  it("handles JSON parse errors", async () => {
    const badReq = new NextRequest("http://test.local", {
      method: "PATCH",
      body: "{ invalid",
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(badReq, { params: Promise.resolve({ shop: "s1" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("invalid json");
    expect(patchTheme).not.toHaveBeenCalled();
  });

  it("propagates service errors", async () => {
    patchTheme.mockRejectedValue(new Error("fail"));
    const res = await PATCH(req({ themeOverrides: {}, themeDefaults: {} }), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
  });
});
