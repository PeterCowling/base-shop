import { describe, expect, it, jest } from "@jest/globals";

import { getLocalStorage, readJson, writeJson } from "../storage";

describe("storage helpers", () => {
  it("returns browser localStorage when available", () => {
    expect(getLocalStorage()).toBe(window.localStorage);
  });

  it("returns parsed JSON when storage contains valid JSON", () => {
    localStorage.setItem("xa-storage-key", JSON.stringify({ ok: true, count: 3 }));
    expect(readJson<{ ok: boolean; count: number }>("xa-storage-key")).toEqual({ ok: true, count: 3 });
  });

  it("returns null for invalid JSON and missing keys", () => {
    localStorage.setItem("xa-storage-invalid", "{bad-json");
    expect(readJson("xa-storage-invalid")).toBeNull();
    expect(readJson("xa-storage-missing")).toBeNull();
  });

  it("writes JSON values and swallows write errors", () => {
    writeJson("xa-storage-write", { hello: "world" });
    expect(localStorage.getItem("xa-storage-write")).toBe("{\"hello\":\"world\"}");

    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => writeJson("xa-storage-write", { denied: true })).not.toThrow();
    setItemSpy.mockRestore();
  });
});
