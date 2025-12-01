import { extractSessionIdFromCharge } from "../src/internal/helpers/risk";

describe("extractSessionIdFromCharge", () => {
  test("returns charge.invoice when present", () => {
    const charge = { invoice: "cs_inv_1" } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("cs_inv_1");
  });

  test("returns invoice from payment_intent.latest_charge", () => {
    const charge = {
      payment_intent: {
        latest_charge: { invoice: "cs_inv_2" },
      },
    } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("cs_inv_2");
  });

  test("returns latest_charge.invoice when charge.invoice is an object", () => {
    const charge = {
      invoice: { id: "inv_obj" },
      payment_intent: {
        latest_charge: { invoice: "cs_inv_3" },
      },
    } as any;
    expect(extractSessionIdFromCharge(charge)).toBe("cs_inv_3");
  });

  test("returns undefined when latest_charge lacks invoice", () => {
    const charge = {
      payment_intent: {
        latest_charge: { id: "ch_3" },
      },
    } as any;
    expect(extractSessionIdFromCharge(charge)).toBeUndefined();
  });
});
