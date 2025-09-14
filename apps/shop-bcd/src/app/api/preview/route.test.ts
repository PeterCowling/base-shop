/** @jest-environment node */
import { POST } from "./route";

function mockReq(result: any, shouldFail = false) {
  return {
    json: shouldFail ? jest.fn().mockRejectedValue(result) : jest.fn().mockResolvedValue(result),
  } as any;
}

describe("POST /api/preview", () => {
  it("sets versions cookie when provided", async () => {
    const res = await POST(mockReq({ versions: { a: 1 } }));
    expect(res.status).toBe(200);
    expect(res.cookies.get("component-versions")?.value).toBe(JSON.stringify({ a: 1 }));
  });

  it("does not set cookie when versions missing", async () => {
    const res = await POST(mockReq({}));
    expect(res.cookies.get("component-versions")).toBeUndefined();
  });

  it("handles invalid JSON gracefully", async () => {
    const res = await POST(mockReq(new Error("bad"), true));
    expect(res.cookies.get("component-versions")).toBeUndefined();
  });
});
