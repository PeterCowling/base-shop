import { GET } from "../route";

describe("media probe route", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("returns 400 when url param is missing", async () => {
    const mockFetch = jest.fn();
    (global as any).fetch = mockFetch;
    const res = await GET(new Request("https://example.com/api/media/probe"));
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Missing url");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 415 when fetch response is not ok", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 404, headers: { "content-type": "image/png" } }));
    (global as any).fetch = mockFetch;
    const res = await GET(
      new Request("https://example.com/api/media/probe?url=https://img.example/broken.png")
    );
    expect(res.status).toBe(415);
  });

  it("returns 415 for non-image content-type", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 200, headers: { "content-type": "text/plain" } }));
    (global as any).fetch = mockFetch;
    const res = await GET(
      new Request("https://example.com/api/media/probe?url=https://img.example/not-image.txt")
    );
    expect(res.status).toBe(415);
  });

  it("returns 400 with message on fetch failure", async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error("network"));
    (global as any).fetch = mockFetch;
    const res = await GET(
      new Request("https://example.com/api/media/probe?url=https://img.example/fail.png")
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Fetch failed");
  });

  it("returns 200 and propagates content-type for images", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 200, headers: { "content-type": "image/jpeg" } }));
    (global as any).fetch = mockFetch;
    const res = await GET(
      new Request("https://example.com/api/media/probe?url=https://img.example/a.jpg")
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(mockFetch).toHaveBeenCalledWith("https://img.example/a.jpg", { method: "HEAD" });
  });
});

