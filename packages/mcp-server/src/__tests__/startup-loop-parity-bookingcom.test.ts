/** @jest-environment node */

import {
  BOOKINGCOM_SURFACE,
  buildBookingcomParityCsvRow,
  buildBookingcomUrl,
  PARITY_SCENARIOS_HEADER,
} from "../startup-loop/parity-bookingcom";

describe("startup-loop bookingcom parity", () => {
  it("TC-01: output row follows notes/taxes conventions", () => {
    expect(PARITY_SCENARIOS_HEADER).toMatch(/^scenario,surface,check_in/);

    const row = buildBookingcomParityCsvRow({
      scenario: "S2",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
      totalPriceAllIn: 180.75,
      currency: "EUR",
      taxesFeesClarity: "includes_taxes",
      cancellationCutoff: "free until 24h",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
    });

    expect(row).toContain(",Booking.com,");
    expect(row).toContain(",180.75,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/source=booking/);
    expect(row).toMatch(/currency_mismatch=false/);
  });

  it("TC-02: failure path produces deterministic row with failure_reason", () => {
    const row = buildBookingcomParityCsvRow({
      scenario: "S1",
      checkIn: "2026-07-17",
      checkOut: "2026-07-19",
      travellers: 1,
      totalPriceAllIn: -1, // Sentinel for unavailable
      currency: "EUR",
      taxesFeesClarity: "unknown",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
      failureReason: "Bot detection triggered",
    });

    expect(row).toContain(",unavailable,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/failure_reason=Bot detection triggered/);
    expect(row).toMatch(/source=booking/);
  });

  it("TC-03: URL builder encodes dates and property ID with EUR currency", () => {
    const url = buildBookingcomUrl({
      propertyId: "hostel-brikette",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
    });

    expect(url).toContain("booking.com");
    expect(url).toContain("/it/hostel-brikette.en-gb.html");
    expect(url).toContain("checkin=2026-05-12");
    expect(url).toContain("checkout=2026-05-14");
    expect(url).toContain("group_adults=1");
    expect(url).toContain("selected_currency=EUR");
  });

  it("TC-04: deposit_payment field is empty (Booking.com doesn't use deposit split)", () => {
    const row = buildBookingcomParityCsvRow({
      scenario: "S3",
      checkIn: "2026-02-24",
      checkOut: "2026-02-26",
      travellers: 1,
      totalPriceAllIn: 120.0,
      currency: "EUR",
      taxesFeesClarity: "includes_taxes",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
    });

    // CSV format: scenario,surface,check_in,check_out,travellers,price,currency,taxes,cutoff,deposit_payment,notes,evidence
    // deposit_payment should be empty field (double comma or empty between commas)
    const fields = row.split(",");
    expect(fields[9]).toBe(""); // deposit_payment field should be empty
  });

  it("TC-05: bot detection failure with slow navigation note", () => {
    const row = buildBookingcomParityCsvRow({
      scenario: "S2",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
      totalPriceAllIn: -1,
      currency: "EUR",
      taxesFeesClarity: "unknown",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://booking.com/captcha",
      failureReason: "CAPTCHA page detected after slow navigation",
    });

    expect(row).toContain(",unavailable,EUR,");
    expect(row).toMatch(/failure_reason=CAPTCHA page detected after slow navigation/);
    expect(row).toContain("booking.com/captcha");
  });
});
