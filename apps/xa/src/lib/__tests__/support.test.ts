import { describe, expect, it } from "@jest/globals";

import { toWhatsappHref, toWhatsappTextHref } from "../support";

describe("support helpers", () => {
  it("builds WhatsApp links", () => {
    expect(toWhatsappHref("+1 (555) 123-4567")).toBe("https://wa.me/15551234567");
    expect(toWhatsappHref("")).toBeNull();
  });

  it("builds WhatsApp links with prefilled text", () => {
    const href = toWhatsappTextHref("+44 1234 567", "Hello there");
    expect(href).toBe("https://wa.me/441234567?text=Hello%20there");
  });
});
