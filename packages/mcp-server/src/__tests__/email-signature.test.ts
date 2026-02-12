/** @jest-environment node */

import { stripLegacySignatureBlock } from "../utils/email-signature";

describe("stripLegacySignatureBlock", () => {
  it("removes multiline sign-off blocks", () => {
    const input =
      "Dear Guest,\r\n\r\nPayment is confirmed.\r\n\r\nWarm regards,\r\n\r\nPeter Cowling\r\nOwner";

    const output = stripLegacySignatureBlock(input);
    expect(output).toBe("Dear Guest,\n\nPayment is confirmed.");
  });

  it("removes single-line sign-offs", () => {
    const input = "Thanks for your email. Best regards, Hostel Brikette";

    const output = stripLegacySignatureBlock(input);
    expect(output).toBe("Thanks for your email.");
  });

  it("keeps content untouched when no signature exists", () => {
    const input = "Thank you, we have received your agreement to the terms and conditions.";

    const output = stripLegacySignatureBlock(input);
    expect(output).toBe(input);
  });
});

