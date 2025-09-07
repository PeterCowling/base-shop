import path from "path";
import { NextRequest } from "next/server";

const getServerSession = jest.fn();
jest.mock("next-auth", () => ({ getServerSession }));

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
    getServerSession.mockResolvedValue({ user: { role: "admin" } });
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { payment: ["stripe"], shipping: ["ups"] },
    });

    const res = await POST(req(), { params: Promise.resolve({ shop: "shop1" }) });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(writeJsonFile).toHaveBeenCalledWith(
      path.join("/tmp/data", "shop1", "providers.json"),
      { payment: ["stripe"], shipping: ["ups"] },
    );
  });

  it("returns 403 for unauthorized user", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await POST(req(), { params: Promise.resolve({ shop: "shop1" }) });

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(parseJsonBody).not.toHaveBeenCalled();
    expect(writeJsonFile).not.toHaveBeenCalled();
  });
});
