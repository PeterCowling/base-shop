// packages/ui/src/hooks/upload/__tests__/uploadToCms.test.ts
import * as api from "../uploadToCms";
import { validateFilePolicy, firstFileFromChange } from "../filePolicy";

describe("uploadToCms + helpers", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch;
  });

  test("validateFilePolicy checks size and type", () => {
    const fOk = new File([new Uint8Array(10)], "a.png", { type: "image/png" });
    const fBadType = new File([1], "a.txt", { type: "text/plain" });
    expect(validateFilePolicy(fOk, ["image/"], 1024)).toBeUndefined();
    expect(validateFilePolicy(fOk, ["video/"], 1024)).toMatch(/Unsupported/);
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "b.png", { type: "image/png" });
    expect(validateFilePolicy(big, ["image/"], 1024 * 1024)).toMatch(/File too large/);
  });

  test("firstFileFromChange returns first file or null", () => {
    const input = document.createElement("input");
    const file = new File([1], "a.txt", { type: "text/plain" });
    const files: any = { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) };
    Object.defineProperty(input, "files", { value: files });
    const e = new Event("change") as any;
    Object.defineProperty(e, "target", { value: input });
    expect(firstFileFromChange(e)).toBe(file);
    const input2 = document.createElement("input");
    const e2 = new Event("change") as any;
    Object.defineProperty(e2, "target", { value: input2 });
    expect(firstFileFromChange(e2)).toBeNull();
  });

  test("uploadToCms returns item on ok and error on failure", async () => {
    const file = new File([1], "a.png", { type: "image/png" });
    // ok response
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ id: "m1" }) });
    const ok = await api.uploadToCms({ shop: "s1", requiredOrientation: "landscape", file });
    expect(ok.item).toEqual({ id: "m1" });
    // error response
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, statusText: "Bad", json: async () => ({ error: "nope" }) });
    const bad = await api.uploadToCms({ shop: "s1", requiredOrientation: "landscape", file });
    expect(bad.error).toBe("nope");
  });
});
