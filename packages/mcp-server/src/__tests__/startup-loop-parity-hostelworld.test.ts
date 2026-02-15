/** @jest-environment node */

import {
  buildHostelworldParityCsvRow,
  buildHostelworldUrl,
  HOSTELWORLD_SURFACE,
  PARITY_SCENARIOS_HEADER,
} from "../startup-loop/parity-hostelworld";

describe("startup-loop hostelworld parity", () => {
  it("TC-01: output row follows notes/taxes conventions", () => {
    expect(PARITY_SCENARIOS_HEADER).toMatch(/^scenario,surface,check_in/);

    const row = buildHostelworldParityCsvRow({
      scenario: "S2",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
      totalPriceAllIn: 150.5,
      depositAmount: 30.0,
      payAtPropertyAmount: 120.5,
      currency: "EUR",
      taxesFeesClarity: "includes_taxes",
      cancellationCutoff: "free until 48h",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
    });

    expect(row).toContain(",Hostelworld,");
    expect(row).toContain(",150.50,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/source=hostelworld/);
    expect(row).toMatch(/currency_mismatch=false/);
    // deposit_payment should contain deposit and pay-at-property details
    expect(row).toMatch(/deposit_amount=30\.00.*pay_at_property=120\.50/);
  });

  it("TC-02: failure path produces deterministic row with failure_reason", () => {
    const row = buildHostelworldParityCsvRow({
      scenario: "S1",
      checkIn: "2026-07-17",
      checkOut: "2026-07-19",
      travellers: 1,
      totalPriceAllIn: -1, // Sentinel for unavailable
      depositAmount: 0,
      payAtPropertyAmount: 0,
      currency: "EUR",
      taxesFeesClarity: "unknown",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
      failureReason: "Price element not found on page",
    });

    expect(row).toContain(",unavailable,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/failure_reason=Price element not found on page/);
    expect(row).toMatch(/source=hostelworld/);
  });

  it("TC-03: URL builder encodes dates and property ID", () => {
    const url = buildHostelworldUrl({
      propertyId: "7763",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
    });

    expect(url).toContain("hostelworld.com");
    expect(url).toContain("/7763/");
    expect(url).toContain("2026-05-12");
    expect(url).toContain("2026-05-14");
  });

  it("TC-04: deposit_payment field captures components when both exist", () => {
    const row = buildHostelworldParityCsvRow({
      scenario: "S3",
      checkIn: "2026-02-24",
      checkOut: "2026-02-26",
      travellers: 1,
      totalPriceAllIn: 100.0,
      depositAmount: 20.0,
      payAtPropertyAmount: 80.0,
      currency: "EUR",
      taxesFeesClarity: "includes_taxes",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
    });

    // deposit_payment should be structured with both components
    expect(row).toMatch(/deposit_amount=20\.00/);
    expect(row).toMatch(/pay_at_property=80\.00/);
  });
});
