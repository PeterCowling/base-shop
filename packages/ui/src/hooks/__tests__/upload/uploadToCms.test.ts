import { uploadToCms } from "../../upload/uploadToCms";

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (global as any).fetch = mockFetch;
});

afterEach(() => {
  (global as any).fetch = originalFetch;
});

describe("uploadToCms", () => {
  it("posts form data and returns item on success", async () => {
    const item = { url: "/img.png", altText: "", type: "image" } as any;
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(item) });
    const res = await uploadToCms({
      shop: "s",
      requiredOrientation: "landscape" as any,
      file: new File(["x"], "x.png", { type: "image/png" }),
      altText: "hello",
      tagsCsv: "a,b",
    });
    expect(res.error).toBeUndefined();
    expect(res.item).toEqual(item);
    const [url, init] = mockFetch.mock.calls[0];
    expect(String(url)).toContain("/cms/api/media?shop=s&orientation=landscape");
    const fd = init.body as FormData;
    expect(fd.get("altText")).toBe("hello");
    expect(fd.get("tags")).toBe(JSON.stringify(["a", "b"]));
  });

  it("returns error when response not ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: "bad", json: () => Promise.resolve({ error: "bad" }) });
    const res = await uploadToCms({
      shop: "s",
      requiredOrientation: "landscape" as any,
      file: new File(["x"], "x.png", { type: "image/png" }),
    });
    expect(res.item).toBeUndefined();
    expect(res.error).toBe("bad");
  });

  it("ignores non-Error rejections", async () => {
    mockFetch.mockRejectedValueOnce("oops");
    const res = await uploadToCms({
      shop: "s",
      requiredOrientation: "landscape" as any,
      file: new File(["x"], "x.png", { type: "image/png" }),
    });
    expect(res).toEqual({});
  });
});

