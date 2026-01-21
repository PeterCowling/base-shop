import { jest } from "@jest/globals";

import { __setMockSession } from "~test/mocks/next-auth";

type MockFn = jest.Mock;

const originalFetch = global.fetch;
async function loadMediaProbeRoute(session: unknown = { user: {} }) {
  __setMockSession(session as any);
  jest.doMock("@cms/auth/options", () => ({ authOptions: {} }));
  const mod = await import("../src/app/api/media/probe/route");
  return { ...mod };
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
  (global as any).fetch = originalFetch;
});

describe("media route", () => {
  it("GET without shop returns 400", async () => {
    jest.doMock("@cms/actions/media.server", () => ({
      listMedia: jest.fn(),
      uploadMedia: jest.fn(),
      deleteMedia: jest.fn(),
    }));
    const { GET } = await import("../src/app/api/media/route");
    const res = await GET(new Request("https://example.com/api/media"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing shop" });
  });

  it("POST returns 400 when upload fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.doMock("@cms/actions/media.server", () => ({
      listMedia: jest.fn(),
      deleteMedia: jest.fn(),
      uploadMedia: jest
        .fn()
        .mockRejectedValue(new Error("Upload failed")),
    }));
    const { POST } = await import("../src/app/api/media/route");
    const fd = new FormData();
    fd.append("file", new File(["data"], "a.txt"));
    const req = {
      url: "https://example.com/api/media?shop=s1",
      formData: async () => fd,
    } as unknown as Request;
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Upload failed" });
    spy.mockRestore();
  });

  it("DELETE without shop or file returns 400", async () => {
    jest.doMock("@cms/actions/media.server", () => ({
      listMedia: jest.fn(),
      uploadMedia: jest.fn(),
      deleteMedia: jest.fn(),
    }));
    const { DELETE } = await import("../src/app/api/media/route");
    const res = await DELETE(new Request("https://example.com/api/media"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing params" });
  });

  it("DELETE returns success when params provided", async () => {
    const mockDelete = (jest.fn() as unknown as MockFn).mockResolvedValue(undefined);
    jest.doMock("@cms/actions/media.server", () => ({
      listMedia: jest.fn(),
      uploadMedia: jest.fn(),
      deleteMedia: mockDelete,
    }));
    const { DELETE } = await import("../src/app/api/media/route");
    const res = await DELETE(
      new Request("https://example.com/api/media?shop=s1&file=f.png"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith("s1", "f.png");
  });
});

describe("media probe route", () => {
  it("returns 400 when url param is missing", async () => {
    const { GET } = await loadMediaProbeRoute();
    const res = await GET(
      new Request("https://example.com/api/media/probe"),
    );
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toBe("Missing url");
  });

  it("returns 415 for unsupported media type", async () => {
    (global as any).fetch = (jest.fn() as unknown as MockFn).mockResolvedValue(
      new Response(null, {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      );
    const { GET } = await loadMediaProbeRoute();
    const res = await GET(
      new Request(
        "https://example.com/api/media/probe?url=https://img.example/file.txt",
      ),
    );
    expect(res.status).toBe(415);
  });

  it("returns 400 when fetch fails", async () => {
    (global as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error("network"));
    const { GET } = await loadMediaProbeRoute();
    const res = await GET(
      new Request(
        "https://example.com/api/media/probe?url=https://img.example/fail.png",
      ),
    );
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toBe("Fetch failed");
  });
});
