import { NextRequest, NextResponse } from "next/server";

const readFile = jest.fn();
const writeFile = jest.fn();
const mkdir = jest.fn();
const rename = jest.fn();
jest.mock("fs", () => ({ promises: { readFile, writeFile, mkdir, rename } }));
jest.mock("@acme/platform-core/dataRoot", () => ({ DATA_ROOT: "/tmp/data" }));
const validateShopName = jest.fn((s: string) => s);
jest.mock("@acme/lib", () => ({ validateShopName }));
const parseJsonBody = jest.fn();
jest.mock("@acme/lib/http/server", () => ({ parseJsonBody }));
const segmentSchema = { extend: jest.fn(() => ({})) } as any;
jest.mock("@acme/types", () => ({ segmentSchema }));

let GET: typeof import("../route").GET;
let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ GET, POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
  validateShopName.mockImplementation((s: string) => s);
});

function getReq(shop?: string) {
  const url = `http://test.local${shop ? `?shop=${shop}` : ""}`;
  return new NextRequest(url);
}

function postReq() {
  return new NextRequest("http://test.local", { method: "POST" } as any);
}

describe("GET", () => {
  it("returns segments for shop", async () => {
    readFile.mockResolvedValue('[{"id":"s1","filters":[]} ]');
    const res = await GET(getReq("shop1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ segments: [{ id: "s1", filters: [] }] });
  });

  it("returns 400 when shop missing", async () => {
    const res = await GET(getReq());
    expect(res.status).toBe(400);
  });

  it("returns empty array on read error", async () => {
    readFile.mockRejectedValue(new Error("fail"));
    const res = await GET(getReq("shop1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ segments: [] });
  });
});

describe("POST", () => {
  it("stores segment data", async () => {
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { shop: "shop1", id: "seg1", name: "Seg 1", filters: [] },
    });
    readFile.mockResolvedValue("[]");
    const res = await POST(postReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(writeFile).toHaveBeenCalled();
  });

  it("returns error for invalid body", async () => {
    parseJsonBody.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: "bad" }, { status: 400 }),
    });
    const res = await POST(postReq());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
  });

  it("returns 401 when unauthorized", async () => {
    parseJsonBody.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });
    const res = await POST(postReq());
    expect(res.status).toBe(401);
  });

  it("throws on write errors", async () => {
    parseJsonBody.mockResolvedValue({
      success: true,
      data: { shop: "shop1", id: "seg1", name: "Seg 1", filters: [] },
    });
    readFile.mockResolvedValue("[]");
    writeFile.mockRejectedValue(new Error("disk"));
    await expect(POST(postReq())).rejects.toThrow("disk");
  });
});
