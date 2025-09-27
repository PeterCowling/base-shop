// packages/ui/src/hooks/upload/__tests__/uploadToCms.test.ts
import type { ChangeEvent } from "react";
import * as api from "../uploadToCms";
import { validateFilePolicy, firstFileFromChange } from "../filePolicy";

describe("uploadToCms + helpers", () => { // i18n-exempt: test titles are not user-facing
  const originalFetch = global.fetch;
  afterEach(() => {
    // @ts-expect-error: restoring test stubbed global.fetch
    global.fetch = originalFetch;
  });

  test("validateFilePolicy checks size and type", () => { // i18n-exempt: test title
    const fOk = new File([new Uint8Array(10)], "a.png", { type: "image/png" });
    expect(validateFilePolicy(fOk, ["image/"], 1024)).toBeUndefined();
    expect(validateFilePolicy(fOk, ["video/"], 1024)).toMatch(/Unsupported/);
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "b.png", { type: "image/png" });
    expect(validateFilePolicy(big, ["image/"], 1024 * 1024)).toMatch(/File too large/);
  });

  test("firstFileFromChange returns first file or null", () => { // i18n-exempt: test title
    const input = document.createElement("input");
    const file = new File([1], "a.txt", { type: "text/plain" });
    const filesLike = { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) } as unknown as FileList;
    Object.defineProperty(input, "files", { value: filesLike });
    const e = { target: input } as unknown as ChangeEvent<HTMLInputElement>;
    expect(firstFileFromChange(e)).toBe(file);
    const input2 = document.createElement("input");
    const e2 = { target: input2 } as unknown as ChangeEvent<HTMLInputElement>;
    expect(firstFileFromChange(e2)).toBeNull();
  });

  test("uploadToCms returns item on ok and error on failure", async () => { // i18n-exempt: test title
    const file = new File([1], "a.png", { type: "image/png" });
    // ok response
    // @ts-expect-error: stubbing global.fetch for test
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ id: "m1" }) });
    const ok = await api.uploadToCms({ shop: "s1", requiredOrientation: "landscape", file });
    expect(ok.item).toEqual({ id: "m1" });
    // error response
    // @ts-expect-error: stubbing global.fetch for test
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, statusText: "Bad", json: async () => ({ error: "nope" }) });
    const bad = await api.uploadToCms({ shop: "s1", requiredOrientation: "landscape", file });
    expect(bad.error).toBe("nope");
  });
});
