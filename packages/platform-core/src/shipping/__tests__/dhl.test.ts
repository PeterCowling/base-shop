import { getTrackingStatus } from "../dhl";

describe("shipping/dhl getTrackingStatus", () => {
  const origFetch = global.fetch as any;
  afterEach(() => {
    global.fetch = origFetch;
  });

  it("handles non-ok response with empty status", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(getTrackingStatus("123")).resolves.toEqual({ status: null, steps: [] });
  });

  it("normalizes status from response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ shipments: [{ status: { status: "Delivered" } }] }),
    });
    const res = await getTrackingStatus("123");
    expect(res).toEqual({ status: "Delivered", steps: [{ label: "Delivered", complete: true }] });
  });

  it("returns empty when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("boom"));
    const res = await getTrackingStatus("x");
    expect(res).toEqual({ status: null, steps: [] });
  });
});

