import path from "path";
import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";

const writeJsonFile = jest.fn();
jest.mock("@/lib/server/jsonIO", () => ({ writeJsonFile }));

jest.mock("@platform-core/dataRoot", () => ({ resolveDataRoot: () => "/tmp/data" }));

const parseJsonBody = jest.fn();
jest.mock("@shared-utils", () => ({ parseJsonBody }));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function req() {
  return new NextRequest("http://test.local", { method: "POST" } as any);
}

describe("POST", () => {
  it("updates providers for authorized user", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { payment: ["stripe"], billingProvider: "stripe", shipping: ["ups"] },
    });

    const res = await POST(req(), { params: Promise.resolve({ shop: "shop1" }) });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(writeJsonFile).toHaveBeenCalledWith(
      path.join("/tmp/data", "shop1", "providers.json"),
      { payment: ["stripe"], billingProvider: "stripe", shipping: ["ups"] },
    );
  });

  it("returns 403 for unauthorized user", async () => {
    __setMockSession(null as any);

    const res = await POST(req(), { params: Promise.resolve({ shop: "shop1" }) });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(parseJsonBody).not.toHaveBeenCalled();
    expect(writeJsonFile).not.toHaveBeenCalled();
  });
});
