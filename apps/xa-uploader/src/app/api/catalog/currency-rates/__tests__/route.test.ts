import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const readCloudCurrencyRatesMock = jest.fn();
const writeCloudCurrencyRatesMock = jest.fn();

class CatalogDraftContractErrorMock extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: CatalogDraftContractErrorMock,
  readCloudCurrencyRates: (...args: unknown[]) => readCloudCurrencyRatesMock(...args),
  writeCloudCurrencyRates: (...args: unknown[]) => writeCloudCurrencyRatesMock(...args),
}));

describe("currency rates route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    readCloudCurrencyRatesMock.mockResolvedValue({ EUR: 0.93, GBP: 0.79, AUD: 1.55 });
    writeCloudCurrencyRatesMock.mockResolvedValue(undefined);
  });

  it("GET returns hosted currency rates", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } });
    expect(readCloudCurrencyRatesMock).toHaveBeenCalledWith("xa-b");
  });

  it("GET returns invalid_rates when hosted contract returns invalid stored rates", async () => {
    readCloudCurrencyRatesMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("invalid_response"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "currency_rates_invalid",
    });
  });

  // B5 — Currency rates missing recovery
  it("B5: GET returns rates: null when no rates have been saved yet", async () => {
    readCloudCurrencyRatesMock.mockResolvedValueOnce(null);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: null });
  });

  it("B5: GET returns service_unavailable when the contract endpoint is unconfigured", async () => {
    class ContractError extends Error {
      code = "unconfigured";
    }
    readCloudCurrencyRatesMock.mockRejectedValueOnce(new ContractError("unconfigured"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "service_unavailable" }),
    );
  });

  it("PUT writes hosted currency rates", async () => {
    const { PUT } = await import("../route");
    const response = await PUT(
      new Request("http://localhost/api/catalog/currency-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(writeCloudCurrencyRatesMock).toHaveBeenCalledWith({
      storefront: "xa-b",
      rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 },
    });
  });
});
