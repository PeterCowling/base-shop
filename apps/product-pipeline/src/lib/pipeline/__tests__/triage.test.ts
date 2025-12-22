import { triageLead } from "../triage";

describe("triageLead", () => {
  it("flags hazmat keywords as hard rejects", () => {
    const result = triageLead({
      id: "lead-1",
      title: "Battery powered mini vacuum",
      url: "https://www.amazon.de/example",
      priceBand: "EUR 12-18",
    });

    expect(result.hardReject).toBe(true);
    expect(result.action).toBe("REJECT_WITH_COOLDOWN");
    expect(result.reasons).toContain("hazmat_keyword");
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("promotes strong, well-priced leads", () => {
    const result = triageLead({
      id: "lead-2",
      title: "Stainless steel modular pantry organizer bins",
      source: "supplier catalog",
      url: "https://www.amazon.de/example",
      priceBand: "EUR 12-18",
    });

    expect(result.hardReject).toBe(false);
    expect(result.band).toBe("high");
    expect(result.action).toBe("PROMOTE_TO_CANDIDATE");
    expect(result.reasons).toEqual(
      expect.arrayContaining(["clear_title", "source_signal", "price_accessible"]),
    );
  });

  it("rejects extreme price bands", () => {
    const low = triageLead({
      id: "lead-3",
      title: "Compact widget set",
      priceBand: "EUR 2-3",
    });

    expect(low.hardReject).toBe(true);
    expect(low.action).toBe("REJECT_WITH_COOLDOWN");
    expect(low.reasons).toContain("price_too_low");

    const high = triageLead({
      id: "lead-4",
      title: "Premium artisan decor set",
      priceBand: "EUR 350-520",
    });

    expect(high.hardReject).toBe(true);
    expect(high.action).toBe("REJECT_WITH_COOLDOWN");
    expect(high.reasons).toContain("price_too_high");
  });
});
