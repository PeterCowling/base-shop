import type { ImageOrientation,MediaItem } from "@acme/types";

import { uploadToCms } from "../../upload/uploadToCms";

const originalFetch = global.fetch;
// Type-safe mock for fetch so we don't rely on `any`
const mockFetch = jest.fn() as unknown as typeof fetch;

beforeEach(() => {
  (mockFetch as unknown as jest.Mock).mockReset();
  (globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;
});

afterEach(() => {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch as typeof fetch;
});

describe("uploadToCms", () => { // i18n-exempt: test description
  it("posts form data and returns item on success", async () => { // i18n-exempt: test description
    document.cookie = "csrf_token=test-token"; // i18n-exempt: test cookie
    const item: MediaItem = { url: "/img.png", altText: "", type: "image" };
    (mockFetch as unknown as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(item) });
    const res = await uploadToCms({
      shop: "s", // i18n-exempt: test data
      requiredOrientation: "landscape" as ImageOrientation,
      file: new File(["x"], "x.png", { type: "image/png" }),
      altText: "hello", // i18n-exempt: test data
      tagsCsv: "a,b", // i18n-exempt: test data
    });
    expect(res.error).toBeUndefined();
    expect(res.item).toEqual(item);
    const [url, init] = (mockFetch as unknown as jest.Mock).mock.calls[0];
    expect(String(url)).toContain("/api/media?shop=s&orientation=landscape");
    expect((init.headers as Record<string, string>)["x-csrf-token"]).toBe("test-token");
    const fd = init.body as FormData;
    expect(fd.get("altText")).toBe("hello"); // i18n-exempt: assertion on test data
    expect(fd.get("tags")).toBe(JSON.stringify(["a", "b"])); // i18n-exempt: assertion on test data
  });

  it("returns error when response not ok", async () => { // i18n-exempt: test description
    (mockFetch as unknown as jest.Mock).mockResolvedValue({ ok: false, statusText: "bad", json: () => Promise.resolve({ error: "bad" }) });
    const res = await uploadToCms({
      shop: "s", // i18n-exempt: test data
      requiredOrientation: "landscape" as ImageOrientation,
      file: new File(["x"], "x.png", { type: "image/png" }),
    });
    expect(res.item).toBeUndefined();
    expect(res.error).toBe("bad"); // i18n-exempt: assertion on test data
  });

  it("ignores non-Error rejections", async () => { // i18n-exempt: test description
    (mockFetch as unknown as jest.Mock).mockRejectedValueOnce("oops"); // i18n-exempt: test data
    const res = await uploadToCms({
      shop: "s", // i18n-exempt: test data
      requiredOrientation: "landscape" as ImageOrientation,
      file: new File(["x"], "x.png", { type: "image/png" }),
    });
    expect(res).toEqual({});
  });
});
