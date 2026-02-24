import { describe, expect, it } from "@jest/globals";

import { fingerprintLead } from "../fingerprint";

describe("fingerprintLead", () => {
  it("normalizes URL host/path and removes www + trailing slash", () => {
    const fingerprint = fingerprintLead({
      url: "https://www.Amazon.de/Products/ABC-123/",
      title: "Ignored when URL is valid",
    });

    expect(fingerprint).toBe("url:amazon.de/products/abc-123");
  });

  it("falls back to normalized title when URL is invalid", () => {
    const fingerprint = fingerprintLead({
      url: "not-a-valid-url",
      title: "  Stainless-Steel   Organizer Bins!  ",
    });

    expect(fingerprint).toBe("title:stainless steel organizer bins");
  });

  it("returns null when neither URL nor title can produce a fingerprint", () => {
    expect(fingerprintLead({ url: null, title: "   " })).toBeNull();
    expect(fingerprintLead({})).toBeNull();
  });
});
