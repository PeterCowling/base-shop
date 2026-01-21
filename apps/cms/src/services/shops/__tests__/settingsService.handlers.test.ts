import { authorize, fetchSettings, persistSettings } from "../helpers";
import {
  setFreezeTranslations,
  updateAiCatalog,
  updateCurrencyAndTax,
  updateDeposit,
  updatePremierDelivery,
  updateReverseLogistics,
  updateStockAlert,
  updateUpsReturns,
} from "../settingsService";
import {
  parseAiCatalogForm,
  parseCurrencyTaxForm,
  parseDepositForm,
  parsePremierDeliveryForm,
  parseReverseLogisticsForm,
  parseStockAlertForm,
  parseUpsReturnsForm,
} from "../validation";

jest.mock("../helpers", () => ({
  authorize: jest.fn().mockResolvedValue(undefined),
  fetchSettings: jest.fn(),
  persistSettings: jest.fn(),
}));

jest.mock("../validation", () => ({
  parseCurrencyTaxForm: jest.fn(),
  parseDepositForm: jest.fn(),
  parseReverseLogisticsForm: jest.fn(),
  parseUpsReturnsForm: jest.fn(),
  parseStockAlertForm: jest.fn(),
  parsePremierDeliveryForm: jest.fn(),
  parseAiCatalogForm: jest.fn(),
}));

const mockAuthorize = authorize as jest.MockedFunction<typeof authorize>;
const mockFetchSettings = fetchSettings as jest.MockedFunction<typeof fetchSettings>;
const mockPersistSettings = persistSettings as jest.MockedFunction<typeof persistSettings>;
const mockParseCurrencyTaxForm = parseCurrencyTaxForm as jest.MockedFunction<typeof parseCurrencyTaxForm>;
const mockParseDepositForm = parseDepositForm as jest.MockedFunction<typeof parseDepositForm>;
const mockParseReverseLogisticsForm = parseReverseLogisticsForm as jest.MockedFunction<typeof parseReverseLogisticsForm>;
const mockParseUpsReturnsForm = parseUpsReturnsForm as jest.MockedFunction<typeof parseUpsReturnsForm>;
const mockParseStockAlertForm = parseStockAlertForm as jest.MockedFunction<typeof parseStockAlertForm>;
const mockParsePremierDeliveryForm = parsePremierDeliveryForm as jest.MockedFunction<typeof parsePremierDeliveryForm>;
const mockParseAiCatalogForm = parseAiCatalogForm as jest.MockedFunction<typeof parseAiCatalogForm>;

describe("settingsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setFreezeTranslations", () => {
    it("persists freeze flag", async () => {
      const current = { foo: "bar", freezeTranslations: false } as any;
      mockFetchSettings.mockResolvedValue(current);

      const result = await setFreezeTranslations("shop", true);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", {
        ...current,
        freezeTranslations: true,
      });
      expect(result).toEqual({ ...current, freezeTranslations: true });
    });
  });

  describe("updateCurrencyAndTax", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar" } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseCurrencyTaxForm.mockReturnValue({
        data: { currency: "USD", taxRegion: "US" },
      });

      const fd = new FormData();
      const result = await updateCurrencyAndTax("shop", fd);
      const expected = { ...current, currency: "USD", taxRegion: "US" };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseCurrencyTaxForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { currency: ["Required"] };
      mockParseCurrencyTaxForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateCurrencyAndTax("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseCurrencyTaxForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updateDeposit", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar" } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseDepositForm.mockReturnValue({
        data: { enabled: true, intervalMinutes: 15 },
      });

      const fd = new FormData();
      const result = await updateDeposit("shop", fd);
      const expected = {
        ...current,
        depositService: { enabled: true, intervalMinutes: 15 },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseDepositForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { intervalMinutes: ["Must be at least 1"] };
      mockParseDepositForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateDeposit("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseDepositForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updateReverseLogistics", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar" } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseReverseLogisticsForm.mockReturnValue({
        data: { enabled: true, intervalMinutes: 10 },
      });

      const fd = new FormData();
      const result = await updateReverseLogistics("shop", fd);
      const expected = {
        ...current,
        reverseLogisticsService: { enabled: true, intervalMinutes: 10 },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseReverseLogisticsForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { intervalMinutes: ["Must be at least 1"] };
      mockParseReverseLogisticsForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateReverseLogistics("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseReverseLogisticsForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updateUpsReturns", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar" } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseUpsReturnsForm.mockReturnValue({
        data: { enabled: true, bagEnabled: true, homePickupEnabled: false },
      });

      const fd = new FormData();
      const result = await updateUpsReturns("shop", fd);
      const expected = {
        ...current,
        returnService: {
          upsEnabled: true,
          bagEnabled: true,
          homePickupEnabled: false,
        },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseUpsReturnsForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { enabled: ["Required"] };
      mockParseUpsReturnsForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateUpsReturns("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseUpsReturnsForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updateStockAlert", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar" } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseStockAlertForm.mockReturnValue({
        data: {
          recipients: ["a@b.com"],
          webhook: "https://hook",
          threshold: 3,
        },
      });

      const fd = new FormData();
      const result = await updateStockAlert("shop", fd);
      const expected = {
        ...current,
        stockAlert: {
          recipients: ["a@b.com"],
          webhook: "https://hook",
          threshold: 3,
        },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseStockAlertForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { recipients: ["Invalid"] };
      mockParseStockAlertForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateStockAlert("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseStockAlertForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updatePremierDelivery", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar", luxuryFeatures: { concierge: true } } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParsePremierDeliveryForm.mockReturnValue({
        data: {
          regions: ["US"],
          windows: ["08-12"],
          carriers: ["ups"],
          surcharge: 5,
          serviceLabel: "label",
        },
      });

      const fd = new FormData();
      const result = await updatePremierDelivery("shop", fd);
      const expected = {
        ...current,
        premierDelivery: {
          regions: ["US"],
          windows: ["08-12"],
          carriers: ["ups"],
          surcharge: 5,
          serviceLabel: "label",
        },
        luxuryFeatures: { concierge: true, premierDelivery: true },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParsePremierDeliveryForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { regions: ["Required"] };
      mockParsePremierDeliveryForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updatePremierDelivery("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParsePremierDeliveryForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });

  describe("updateAiCatalog", () => {
    it("persists merged settings for valid data", async () => {
      const current = { foo: "bar", seo: { other: true } } as any;
      mockFetchSettings.mockResolvedValue(current);
      mockParseAiCatalogForm.mockReturnValue({
        data: { enabled: true, fields: ["title"], pageSize: 20 },
      });

      const fd = new FormData();
      const result = await updateAiCatalog("shop", fd);
      const expected = {
        ...current,
        seo: {
          ...current.seo,
          aiCatalog: { enabled: true, fields: ["title"], pageSize: 20 },
        },
      };

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseAiCatalogForm).toHaveBeenCalledWith(fd);
      expect(mockPersistSettings).toHaveBeenCalledWith("shop", expected);
      expect(result.settings).toEqual(expected);
    });

    it("returns errors for invalid data", async () => {
      const errors = { pageSize: ["Required"] };
      mockParseAiCatalogForm.mockReturnValue({ errors });
      const fd = new FormData();

      const result = await updateAiCatalog("shop", fd);

      expect(mockAuthorize).toHaveBeenCalled();
      expect(mockParseAiCatalogForm).toHaveBeenCalledWith(fd);
      expect(result).toEqual({ errors });
      expect(mockFetchSettings).not.toHaveBeenCalled();
      expect(mockPersistSettings).not.toHaveBeenCalled();
    });
  });
});

