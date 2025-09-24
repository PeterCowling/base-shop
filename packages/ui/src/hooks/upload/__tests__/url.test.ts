// packages/ui/src/hooks/upload/__tests__/url.test.ts
import { extractUrlFromText, isSafeHttpUrl } from "../url";

describe("upload/url utils", () => {
  test("isSafeHttpUrl allows http/https and rejects javascript/data/invalid", () => {
    expect(isSafeHttpUrl("https://a.com"));
    expect(isSafeHttpUrl("http://a.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/plain,hi")).toBe(false);
    expect(isSafeHttpUrl("not-a-url")).toBe(false);
  });

  test("extractUrlFromText finds first http(s) URL and validates scheme", () => {
    expect(extractUrlFromText(" see https://a.com/img.png in text ")).toBe("https://a.com/img.png");
    expect(extractUrlFromText("javascript:alert(1)")).toBeNull();
    expect(extractUrlFromText("no urls here")).toBeNull();
  });
});

