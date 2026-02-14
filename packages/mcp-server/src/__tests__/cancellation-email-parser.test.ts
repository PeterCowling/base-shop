// File: /src/__tests__/cancellation-email-parser.test.ts
/**
 * Tests for cancellation email parser (TASK-13)
 * Validates extraction of Octorate compound reservation IDs from cancellation emails
 */

import { parseCancellationEmail } from "../parsers/cancellation-email-parser";

describe("parseCancellationEmail", () => {
  // TC-01: Parse sample Octorate cancellation email → extracts correct reservationCode (first number)
  test("TC-01: should extract reservation code from sample Octorate cancellation email", () => {
    const from = "Octorate <noreply@smtp.octorate.com>";
    const subject = "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30";
    const body =
      "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30 - 2026-09-01 hostel brikette positano ID 109293508:27778396 ROOMS OTA, Refundable, Room 10";

    const result = parseCancellationEmail(body, from);

    expect(result).not.toBeNull();
    expect(result?.reservationCode).toBe("6896451364");
    expect(result?.provider).toBe("octorate");
  });

  // TC-02: Parse email with subject pattern → reservation code extracted
  test("TC-02: should extract reservation code from subject line pattern", () => {
    const from = "Octorate <noreply@smtp.octorate.com>";
    const emailHtml = `
      <div>
        <p>Subject: NEW CANCELLATION 5326571789_6061107686 Booking 2026-05-13</p>
        <p>Your booking has been cancelled.</p>
      </div>
    `;

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).not.toBeNull();
    expect(result?.reservationCode).toBe("5326571789");
    expect(result?.provider).toBe("octorate");
  });

  // TC-03: Parse email with HTML body pattern → reservation code extracted
  test("TC-03: should extract reservation code from HTML body table pattern", () => {
    const from = "Octorate <noreply@smtp.octorate.com>";
    const emailHtml = `
      <table>
        <tr><td><b>reservation code</b></td><td>7123456789_8234567890</td></tr>
        <tr><td><b>guest name</b></td><td>John Example</td></tr>
      </table>
    `;

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).not.toBeNull();
    expect(result?.reservationCode).toBe("7123456789");
    expect(result?.provider).toBe("octorate");
  });

  // TC-04: Parse email from Hostelworld → returns null (OTA ignored)
  test("TC-04: should return null for Hostelworld cancellation (OTA ignored)", () => {
    const from = "Market Support <support@hostelworld.com>";
    const emailHtml = `
      <p>Subject: Booking Cancelled</p>
      <p>Your Hostelworld booking has been cancelled.</p>
    `;

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).toBeNull();
  });

  // TC-05: Parse malformed email (no reservation code) → returns null (graceful failure)
  test("TC-05: should return null for malformed email without reservation code", () => {
    const from = "Octorate <noreply@smtp.octorate.com>";
    const emailHtml = `
      <p>This is a cancellation notification but missing the reservation code.</p>
    `;

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).toBeNull();
  });

  // Additional edge case: Email from Booking.com should also be ignored (OTA)
  test("should return null for Booking.com cancellation (OTA ignored)", () => {
    const from = "Booking.com <noreply@booking.com>";
    const emailHtml = `
      <p>Your booking has been cancelled.</p>
      <table>
        <tr><td><b>reservation code</b></td><td>1234567890_9876543210</td></tr>
      </table>
    `;

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).toBeNull();
  });

  // Additional edge case: Compound ID with only subject line
  test("should extract reservation code from NEW CANCELLATION subject only", () => {
    const from = "Octorate <noreply@smtp.octorate.com>";
    const emailHtml = "NEW CANCELLATION 9999888877_1111222233 Booking 2026-12-25";

    const result = parseCancellationEmail(emailHtml, from);

    expect(result).not.toBeNull();
    expect(result?.reservationCode).toBe("9999888877");
  });
});
