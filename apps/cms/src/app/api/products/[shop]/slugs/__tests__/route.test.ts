import { NextRequest } from "next/server";

const readRepo = jest.fn();

jest.mock("@platform-core/repositories/json.server", () => ({
  readRepo: (shop: string) => readRepo(shop),
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

function request(body?: unknown, raw = false) {
  const init: any = { method: "POST" };
  if (body !== undefined) {
    init.body = raw ? body : JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return new NextRequest("http://test.local", init);
}

describe("POST", () => {
  it.each([
    { name: "empty body", req: () => request(undefined) },
    { name: "malformed json", req: () => request("not json", true) },
  ])("returns empty array for %s", async ({ req: makeReq }) => {
    const res = await POST(makeReq(), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
    expect(readRepo).not.toHaveBeenCalled();
  });

  it("filters existing slugs", async () => {
    readRepo.mockResolvedValue([
      { id: "p1", sku: "p1" },
      { id: "p2", sku: "p2" },
    ]);
    const res = await POST(request({ slugs: ["p2", "p3"] }), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["p2"]);
    expect(readRepo).toHaveBeenCalledWith("s1");
  });

  it("handles repository errors gracefully", async () => {
    readRepo.mockRejectedValue(new Error("fail"));
    const res = await POST(request({ slugs: ["p1"] }), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
