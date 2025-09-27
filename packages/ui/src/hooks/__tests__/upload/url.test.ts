import { isSafeHttpUrl, extractUrlFromText } from "../../upload/url";

describe("isSafeHttpUrl", () => { // i18n-exempt: test description
  it("accepts http and https", () => { // i18n-exempt: test description
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("https://example.com/path?q=1")).toBe(true);
  });
  it("rejects javascript and data URIs", () => { // i18n-exempt: test description
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/plain,hi")).toBe(false);
  });
  it("rejects invalid strings", () => { // i18n-exempt: test description
    expect(isSafeHttpUrl("not a url")).toBe(false); // i18n-exempt: test data
  });
});

describe("extractUrlFromText", () => { // i18n-exempt: test description
  it("returns trimmed URL when alone", () => { // i18n-exempt: test description
    expect(extractUrlFromText("  https://example.com/a.png  ")).toBe(
      "https://example.com/a.png", // i18n-exempt: test data
    );
  });
  it("extracts URL within surrounding text", () => { // i18n-exempt: test description
    const text = "see http://example.com/image.jpg now"; // i18n-exempt: test data
    expect(extractUrlFromText(text)).toBe("http://example.com/image.jpg"); // i18n-exempt: test data
  });
  it("returns null when no URL present", () => { // i18n-exempt: test description
    expect(extractUrlFromText("hello world")).toBeNull(); // i18n-exempt: test data
  });
});
