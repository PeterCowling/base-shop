/* i18n-exempt file -- test titles and messages are developer-facing */
import { validateFilePolicy, firstFileFromChange } from "../../upload/filePolicy";
import type React from "react";

describe("validateFilePolicy", () => {
  it("returns undefined for valid image under size limit", () => {
    const file = new File([new Uint8Array(10)], "a.png", { type: "image/png" });
    const err = validateFilePolicy(file, ["image/"], 1024);
    expect(err).toBeUndefined();
  });

  it("returns size error when file exceeds maxBytes", () => {
    const file = new File([new Uint8Array(2 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    const err = validateFilePolicy(file, ["image/"], 1024);
    expect(err).toMatch(/File too large/);
  });

  it("returns type error when MIME does not match allowed prefixes", () => {
    const file = new File([new Uint8Array(10)], "a.txt", { type: "text/plain" });
    const err = validateFilePolicy(file, ["image/"]);
    expect(err).toMatch(/Unsupported file type/);
  });
});

describe("firstFileFromChange", () => {
  it("returns first file from input change", () => {
    const f = new File(["x"], "x.png", { type: "image/png" });
    const e = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    expect(firstFileFromChange(e)).toBe(f);
  });

  it("returns null when no files present", () => {
    const e = { target: { files: [] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    expect(firstFileFromChange(e)).toBeNull();
  });
});
