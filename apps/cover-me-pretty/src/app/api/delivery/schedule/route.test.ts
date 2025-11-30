// apps/cover-me-pretty/src/app/api/delivery/schedule/route.test.ts
import { type NextRequest } from "next/server";
import { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

const parseJsonBody = jest.fn();
const getShopSettings = jest.fn();

jest.mock("@shared-utils", () => ({ parseJsonBody }));
jest.mock("@platform-core/repositories/settings.server", () => ({ getShopSettings }));

let POST: typeof import("./route").POST;

beforeAll(async () => {
  ({ POST } = await import("./route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

type DeliveryScheduleRequestBody = {
  region: string;
  window: string;
  carrier?: string;
};

function makeReq(body: DeliveryScheduleRequestBody): NextRequest {
  parseJsonBody.mockResolvedValue({ success: true, data: body });
  return {} as NextRequest;
}

describe("POST", () => {
  it("returns 400 when region or window not allowed", async () => {
    getShopSettings.mockResolvedValue({
      luxuryFeatures: { premierDelivery: true },
      premierDelivery: { regions: ["north"], windows: ["morning"] },
    });
    const res = await POST(makeReq({ region: "south", window: "morning" }));
    expect(res.status).toBe(400);
  });

  it("sets cookie and returns 200 when allowed", async () => {
    getShopSettings.mockResolvedValue({
      luxuryFeatures: { premierDelivery: true },
      premierDelivery: { regions: ["north"], windows: ["morning"] },
    });
    const setSpy = jest.spyOn(ResponseCookies.prototype, "set");
    const res = await POST(makeReq({ region: "north", window: "morning", carrier: "ups" }));
    expect(res.status).toBe(200);
    expect(setSpy).toHaveBeenCalledWith(
      "delivery",
      JSON.stringify({ region: "north", window: "morning", carrier: "ups" }),
      { path: "/" },
    );
    setSpy.mockRestore();
  });
});
