/** @jest-environment node */

import { commissionByChannelRowsToCsv, deriveCommissionByChannel } from "../startup-loop/commission";
import ratesConfig from "../startup-loop/commission-rates.json";

describe("startup-loop commission derivation", () => {
  it("TC-01: commission is computed as gross * rate with 2dp rounding", () => {
    const rows = deriveCommissionByChannel(
      [
        { month: "2025-03", channel: "Booking.com", gross_value: 110 },
        { month: "2025-03", channel: "Hostelworld", gross_value: 70 },
      ],
      ratesConfig,
    );

    const booking = rows.find((r) => r.channel === "Booking.com");
    expect(booking?.commission_amount).toBe(16.5);
    expect(booking?.effective_take_rate).toBeCloseTo(0.15, 6);
    expect(booking?.notes).toMatch(/rate=0\.15/);

    const hw = rows.find((r) => r.channel === "Hostelworld");
    expect(hw?.commission_amount).toBe(7);
    expect(hw?.effective_take_rate).toBeCloseTo(0.1, 6);
  });

  it("TC-02: Direct is always zero and gross==0 is handled", () => {
    const rows = deriveCommissionByChannel(
      [
        { month: "2025-05", channel: "Direct", gross_value: 999 },
        { month: "2025-06", channel: "Booking.com", gross_value: 0 },
      ],
      ratesConfig,
    );

    const direct = rows.find((r) => r.channel === "Direct");
    expect(direct?.commission_amount).toBe(0);
    expect(direct?.effective_take_rate).toBe(0);

    const zero = rows.find((r) => r.month === "2025-06");
    expect(zero?.commission_amount).toBe(0);
    expect(zero?.effective_take_rate).toBe(0);
    expect(zero?.notes).toMatch(/gross_zero=true/);
  });

  it("TC-03: missing rate for channel fails loudly", () => {
    expect(() =>
      deriveCommissionByChannel(
        [{ month: "2025-01", channel: "Booking.com", gross_value: 1 }],
        { currency: "EUR", rates: [] },
      ),
    ).toThrow(/missing_rate_for_channel/i);
  });

  it("TC-04: CSV output is deterministic", () => {
    const rows = deriveCommissionByChannel(
      [{ month: "2025-03", channel: "Booking.com", gross_value: 110 }],
      ratesConfig,
    );
    const csv = commissionByChannelRowsToCsv(rows);
    expect(csv).toMatch(/^month,channel,commission_amount,currency,effective_take_rate,notes\n/);
    expect(csv).toMatch(/2025-03,Booking\.com,16\.50,EUR,0\.1500,/);
  });
});
