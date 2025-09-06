import { parseCurrencyTaxForm } from "../parseCurrencyTaxForm";

describe("parseCurrencyTaxForm", () => {
  it("requires currency and tax region", () => {
    const fd = new FormData();
    fd.set("currency", "USD");
    fd.set("taxRegion", "CA");

    const result = parseCurrencyTaxForm(fd);
    expect(result.data).toEqual({ currency: "USD", taxRegion: "CA" });
  });

  it("validates currency length", () => {
    const fd = new FormData();
    fd.set("currency", "US");
    fd.set("taxRegion", "CA");

    const result = parseCurrencyTaxForm(fd);
    expect(result.errors).toHaveProperty("currency");
  });

  it("ignores unknown fields", () => {
    const fd = new FormData();
    fd.set("currency", "USD");
    fd.set("taxRegion", "CA");
    fd.set("unknown", "x");

    const result = parseCurrencyTaxForm(fd);
    expect(result.data).toEqual({ currency: "USD", taxRegion: "CA" });
    expect((result.data as any).unknown).toBeUndefined();
  });
});
