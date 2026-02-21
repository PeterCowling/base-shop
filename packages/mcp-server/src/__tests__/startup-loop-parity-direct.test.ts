/** @jest-environment node */

import {
  buildDirectParityCsvRow,
  buildDirectUrl,
  PARITY_SCENARIOS_HEADER,
  parseNumberLike,
} from "../startup-loop/parity-direct";

describe("startup-loop direct parity", () => {
  it("TC-01: CSV header and row formatting are deterministic (auto mode success)", () => {
    expect(PARITY_SCENARIOS_HEADER).toMatch(/^scenario,surface,check_in/);

    const row = buildDirectParityCsvRow({
      scenario: "S2",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      travellers: 1,
      totalPriceAllIn: 123.456,
      currency: "EUR",
      taxesFeesClarity: "includes_taxes",
      cancellationCutoff: "free until 24h",
      captureMode: "auto",
      capturedAtIso: "2026-02-15T12:00:00.000Z",
      evidenceUrl: "https://example.com",
    });

    expect(row).toContain(",Direct,");
    expect(row).toContain(",123.46,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/currency_mismatch=false/);
  });

  it("TC-02: failure path writes row with unavailable and failure_reason", () => {
    const row = buildDirectParityCsvRow({
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
      failureReason: "Price element not found on page",
    });

    expect(row).toContain(",unavailable,EUR,");
    expect(row).toMatch(/capture_mode=auto/);
    expect(row).toMatch(/failure_reason=Price element not found on page/);
  });

  it("TC-03: URL builder encodes expected params", () => {
    const url = buildDirectUrl({
      codice: "45111",
      checkIn: "2026-05-12",
      checkOut: "2026-05-14",
      pax: 1,
      currency: "EUR",
    });

    expect(url).toContain("codice=45111");
    expect(url).toContain("checkin=2026-05-12");
    expect(url).toContain("checkout=2026-05-14");
    expect(url).toContain("pax=1");
    expect(url).toContain("currency=EUR");
  });

  it("TC-04: number parsing tolerates common formats", () => {
    expect(parseNumberLike("123.45")).toBeCloseTo(123.45, 8);
    expect(parseNumberLike("EUR 123,45")).toBeCloseTo(123.45, 8);
    expect(parseNumberLike("€123,45")).toBeCloseTo(123.45, 8);
  });
});
