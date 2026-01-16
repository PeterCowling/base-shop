import { NextRequest, NextResponse } from "next/server";

jest
  .spyOn(NextResponse, "redirect")
  .mockImplementation((url: string) =>
    new Response(null, { status: 307, headers: { location: url } }),
  );

const mkdir = jest.fn();
const writeFile = jest.fn();
jest.mock("fs", () => ({ promises: { mkdir, writeFile } }));
jest.mock("@acme/platform-core/dataRoot", () => ({ resolveDataRoot: () => "/tmp/data" }));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
  mkdir.mockResolvedValue(undefined);
  writeFile.mockResolvedValue(undefined);
});

function request(path: string) {
  return new NextRequest(`http://test.local/cms/api/providers/stripe${path}`);
}

describe("GET", () => {
  it("writes token and redirects to configurator", async () => {
    const res = await GET(request("?shop=s1&code=xyz"), {
      params: Promise.resolve({ provider: "stripe" }),
    });
    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "/cms/configurator?connected=stripe"
    );
  });

  it("redirects for missing code", async () => {
    const res = await GET(request("?shop=s1"), {
      params: Promise.resolve({ provider: "stripe" }),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/cms/api/providers/stripe?shop=s1&code=dummy-token",
    );
  });

  it("returns 400 for invalid shop", async () => {
    const res = await GET(request(""), {
      params: Promise.resolve({ provider: "stripe" }),
    });
    expect(res.status).toBe(400);
  });

  it("throws when mkdir fails", async () => {
    mkdir.mockRejectedValue(new Error("denied"));
    await expect(
      GET(request("?shop=s1&code=xyz"), {
        params: Promise.resolve({ provider: "stripe" }),
      }),
    ).rejects.toThrow("denied");
  });

  it("throws on write error", async () => {
    writeFile.mockRejectedValue(new Error("disk"));
    await expect(
      GET(request("?shop=s1&code=xyz"), {
        params: Promise.resolve({ provider: "stripe" }),
      }),
    ).rejects.toThrow("disk");
  });
});
