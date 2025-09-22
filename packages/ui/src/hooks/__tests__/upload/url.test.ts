import { isSafeHttpUrl, extractUrlFromText } from "../../upload/url";

describe("isSafeHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("https://example.com/path?q=1")).toBe(true);
  });
  it("rejects javascript and data URIs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/plain,hi")).toBe(false);
  });
  it("rejects invalid strings", () => {
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
});

describe("extractUrlFromText", () => {
  it("returns trimmed URL when alone", () => {
    expect(extractUrlFromText("  https://example.com/a.png  ")).toBe(
      "https://example.com/a.png",
    );
  });
  it("extracts URL within surrounding text", () => {
    const text = "see http://example.com/image.jpg now";
    expect(extractUrlFromText(text)).toBe("http://example.com/image.jpg");
  });
  it("returns null when no URL present", () => {
    expect(extractUrlFromText("hello world")).toBeNull();
  });
});

