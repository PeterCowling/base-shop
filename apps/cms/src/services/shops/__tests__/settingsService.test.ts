import { updateCurrencyAndTax } from "../settingsService";
import { authorize } from "../authorization";
import { fetchSettings, persistSettings } from "../persistence";
import { parseCurrencyTaxForm } from "../validation";

jest.mock("../authorization", () => ({ authorize: jest.fn() }));
jest.mock("../persistence", () => ({
  fetchSettings: jest.fn().mockResolvedValue({ currency: "USD", taxRegion: "US" }),
  persistSettings: jest.fn(),
}));
jest.mock("../validation", () => ({
  parseCurrencyTaxForm: jest.fn(),
}));

describe("settingsService", () => {
  it("updates currency and tax region", async () => {
    (parseCurrencyTaxForm as jest.Mock).mockReturnValue({
      data: { currency: "EUR", taxRegion: "EU" },
      errors: undefined,
    });
    const result = await updateCurrencyAndTax("shop", new FormData());
    expect(authorize).toHaveBeenCalled();
    expect(persistSettings).toHaveBeenCalledWith("shop", {
      currency: "EUR",
      taxRegion: "EU",
    });
    expect(result.settings?.currency).toBe("EUR");
  });
});
