import { updateCurrencyAndTax } from "../settingsService";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn(),
  persistSettings: jest.fn(),
}));

describe("settings service", () => {
  it("returns validation errors for missing currency and tax region", async () => {
    const fd = new FormData();
    const result = await updateCurrencyAndTax("shop", fd);
    expect(result.errors?.currency[0]).toBe("Required");
    expect(result.errors?.taxRegion[0]).toBe("Required");
  });
});
