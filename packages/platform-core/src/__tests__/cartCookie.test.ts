/** @jest-environment node */

import { decodeCartCookie, encodeCartCookie } from "../cartCookie";

describe("decodeCartCookie", () => {
  it("logs and returns null for invalid signature", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const valid = encodeCartCookie(JSON.stringify({ id: "123" }));
    const [encoded] = valid.split(".");
    const tampered = `${encoded}.invalid`; // wrong signature

    expect(decodeCartCookie(tampered)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith("Invalid cart cookie");

    warnSpy.mockRestore();
  });

  it("returns original string when payload is plain text", () => {
    const original = "plain";
    const parseSpy = jest.spyOn(JSON, "parse");
    const encoded = encodeCartCookie(original);
    expect(decodeCartCookie(encoded)).toBe(original);
    expect(parseSpy).toHaveBeenCalledWith(original);
    expect(parseSpy.mock.results[0].type).toBe("throw");
    parseSpy.mockRestore();
  });
});
