import { NextRequest } from "next/server";

const getServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession }));
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const writeReturnLogistics = jest.fn();
jest.mock("@platform-core/repositories/returnLogistics.server", () => ({
  writeReturnLogistics,
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req(body: string) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it("writes return logistics and returns success", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    const data = {
      labelService: "ups",
      inStore: true,
      dropOffProvider: "provider",
      tracking: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      mobileApp: true,
      requireTags: false,
      allowWear: true,
    };
    const res = await POST(req(JSON.stringify(data)), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(writeReturnLogistics).toHaveBeenCalledWith(data);
  });

  it("returns 400 for malformed JSON", async () => {
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    const res = await POST(req("{"), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(writeReturnLogistics).not.toHaveBeenCalled();
  });
});
