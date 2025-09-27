import { NextRequest } from "next/server";

const mockReturnService: any = { upsEnabled: true, bagEnabled: false, homePickupEnabled: false };
const mockGetReturnLogistics = jest.fn();
const mockSetReturnTracking = jest.fn();
const mockFetch = jest.fn();

jest.mock("@platform-core/returnLogistics", () => ({
  getReturnLogistics: (...args: any[]) => mockGetReturnLogistics(...args),
}));

jest.mock("@platform-core/orders", () => ({
  setReturnTracking: (...args: any[]) => mockSetReturnTracking(...args),
}));

jest.mock("../../../../shop.json", () => ({
  __esModule: true,
  default: { id: "shop1", returnService: mockReturnService },
}));

let POST: typeof import("./route").POST;
let GET: typeof import("./route").GET;

beforeAll(async () => {
  const mod = await import("./route");
  POST = mod.POST;
  GET = mod.GET;
});

beforeEach(() => {
  mockGetReturnLogistics.mockReset();
  mockSetReturnTracking.mockReset();
  mockFetch.mockReset();
  mockReturnService.upsEnabled = true;
  mockReturnService.bagEnabled = false;
  mockReturnService.homePickupEnabled = false;
  // @ts-expect-error: mocking global.fetch in Node test environment
  global.fetch = mockFetch;
});

describe("POST /api/return", () => {
  test("unsupported carrier returns 400", async () => {
    mockGetReturnLogistics.mockResolvedValue({
      labelService: "ups",
      returnCarrier: ["fedex"],
    });

    const req = new NextRequest("http://example.com", {
      method: "POST",
      body: JSON.stringify({ sessionId: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "unsupported carrier" });
    expect(mockSetReturnTracking).not.toHaveBeenCalled();
  });

  test("successful label creation calls setReturnTracking and returns tracking info", async () => {
    mockGetReturnLogistics.mockResolvedValue({
      labelService: "ups",
      returnCarrier: ["ups"],
      dropOffProvider: "ups-store",
      bagType: "bag",
      homePickupZipCodes: ["10001"],
    });
    mockReturnService.bagEnabled = true;
    mockReturnService.homePickupEnabled = true;
    mockFetch.mockResolvedValue({ json: jest.fn().mockResolvedValue({}) });
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1234567891);

    const req = new NextRequest("http://example.com", {
      method: "POST",
      body: JSON.stringify({ sessionId: "abc" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockSetReturnTracking).toHaveBeenCalledWith(
      "shop1",
      "abc",
      "1Z1234567891",
      "https://www.ups.com/track?loc=en_US&tracknum=1Z1234567891",
    );
    expect(data.tracking).toEqual({
      number: "1Z1234567891",
      labelUrl: "https://www.ups.com/track?loc=en_US&tracknum=1Z1234567891",
    });
    expect(data.returnCarrier).toEqual(["ups"]);
    expect(data.bagType).toBe("bag");
    expect(data.homePickupZipCodes).toEqual(["10001"]);

    randomSpy.mockRestore();
  });
});

describe("GET /api/return", () => {
  test("missing tracking returns 400", async () => {
    const req = new NextRequest("http://example.com");
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "missing tracking" });
    expect(mockGetReturnLogistics).not.toHaveBeenCalled();
  });

  test("unsupported carrier returns 400", async () => {
    mockGetReturnLogistics.mockResolvedValue({
      labelService: "ups",
      returnCarrier: ["fedex"],
    });
    const req = new NextRequest("http://example.com?tracking=1Z123", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "unsupported carrier" });
  });

  test("successful fetch returns status", async () => {
    mockGetReturnLogistics.mockResolvedValue({
      labelService: "ups",
      returnCarrier: ["ups"],
    });
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        trackDetails: [
          { packageStatus: { statusType: "DELIVERED" } },
        ],
      }),
    });

    const req = new NextRequest("http://example.com?tracking=1Z123", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: "DELIVERED" });
  });
});
