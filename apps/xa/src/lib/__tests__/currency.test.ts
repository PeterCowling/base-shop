import { describe, expect, it } from "@jest/globals";

import { XA_DEFAULT_CURRENCY, XA_SUPPORTED_CURRENCIES } from "../currency";

describe("currency defaults", () => {
  it("exposes default and supported currencies", () => {
    expect(XA_DEFAULT_CURRENCY).toBe("AUD");
    expect(XA_SUPPORTED_CURRENCIES).toContain("USD");
  });
});
