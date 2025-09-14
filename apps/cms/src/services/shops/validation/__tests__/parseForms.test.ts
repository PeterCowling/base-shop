import {
  parseAiCatalogForm,
  parseCurrencyTaxForm,
  parseDepositForm,
  parseLateFeeForm,
  parseGenerateSeoForm,
  parsePremierDeliveryForm,
  parseReverseLogisticsForm,
  parseSeoForm,
  parseShopForm,
  parseStockAlertForm,
  parseUpsReturnsForm,
} from "..";

describe("parseAiCatalogForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("pageSize", "10");
    fd.append("fields", "id");
    fd.append("fields", "title");
    const result = parseAiCatalogForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("pageSize", "0");
    fd.append("fields", "invalid");
    const result = parseAiCatalogForm(fd);
    expect(result.errors?.pageSize).toBeDefined();
    expect(result.errors?.fields).toBeDefined();
  });
});

describe("parseCurrencyTaxForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("currency", "USD");
    fd.set("taxRegion", "US");
    const result = parseCurrencyTaxForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("currency", "US");
    fd.set("taxRegion", "");
    const result = parseCurrencyTaxForm(fd);
    expect(result.errors?.currency).toBeDefined();
    expect(result.errors?.taxRegion).toBeDefined();
  });
});

describe("parseDepositForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "5");
    const result = parseDepositForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "0");
    const result = parseDepositForm(fd);
    expect(result.errors?.intervalMinutes).toBeDefined();
  });
});

describe("parseLateFeeForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "5");
    const result = parseLateFeeForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "0");
    const result = parseLateFeeForm(fd);
    expect(result.errors?.intervalMinutes).toBeDefined();
  });
});

describe("parseGenerateSeoForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("id", "123");
    fd.set("locale", "en");
    fd.set("title", "Title");
    fd.set("description", "Desc");
    const result = parseGenerateSeoForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("id", "");
    fd.set("locale", "fr");
    fd.set("title", "");
    fd.set("description", "");
    const result = parseGenerateSeoForm(fd);
    expect(result.errors?.id).toBeDefined();
    expect(result.errors?.locale).toBeDefined();
    expect(result.errors?.title).toBeDefined();
    expect(result.errors?.description).toBeDefined();
  });
});

describe("parsePremierDeliveryForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.append("regions", "US");
    fd.append("windows", "09-17");
    fd.append("carriers", "UPS");
    fd.set("surcharge", "5");
    fd.set("serviceLabel", "express");
    const result = parsePremierDeliveryForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.append("windows", "bad-window");
    fd.set("surcharge", "-1");
    const result = parsePremierDeliveryForm(fd);
    expect(result.errors?.windows).toBeDefined();
    expect(result.errors?.surcharge).toBeDefined();
  });
});

describe("parseReverseLogisticsForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "10");
    const result = parseReverseLogisticsForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("intervalMinutes", "0");
    const result = parseReverseLogisticsForm(fd);
    expect(result.errors?.intervalMinutes).toBeDefined();
  });
});

describe("parseSeoForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("locale", "en");
    fd.set("title", "Title");
    fd.set("description", "Description");
    fd.set("image", "https://example.com/image.jpg");
    fd.set("alt", "alt text");
    fd.set("canonicalBase", "https://example.com");
    fd.set("ogUrl", "https://example.com/og");
    fd.set("twitterCard", "summary");
    const result = parseSeoForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("locale", "fr");
    fd.set("title", "");
    fd.set("image", "not-a-url");
    fd.set("canonicalBase", "bad");
    fd.set("ogUrl", "also-bad");
    fd.set("twitterCard", "invalid");
    const result = parseSeoForm(fd);
    expect(result.errors?.locale).toBeDefined();
    expect(result.errors?.title).toBeDefined();
    expect(result.errors?.image).toBeDefined();
    expect(result.errors?.canonicalBase).toBeDefined();
    expect(result.errors?.ogUrl).toBeDefined();
    expect(result.errors?.twitterCard).toBeDefined();
  });
});

describe("parseShopForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("name", "Shop");
    fd.set("themeId", "theme1");
    const result = parseShopForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("id", "1");
    const result = parseShopForm(fd);
    expect(result.errors?.name).toBeDefined();
    expect(result.errors?.themeId).toBeDefined();
  });
});

describe("parseStockAlertForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("recipients", "user@example.com");
    fd.set("webhook", "https://example.com");
    fd.set("threshold", "5");
    const result = parseStockAlertForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("recipients", "not-an-email");
    fd.set("webhook", "bad");
    fd.set("threshold", "0");
    const result = parseStockAlertForm(fd);
    expect(result.errors?.recipients).toBeDefined();
    expect(result.errors?.webhook).toBeDefined();
    expect(result.errors?.threshold).toBeDefined();
  });
});

describe("parseUpsReturnsForm", () => {
  it("parses valid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("bagEnabled", "on");
    fd.set("homePickupEnabled", "on");
    const result = parseUpsReturnsForm(fd);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it("returns errors for invalid data", () => {
    const fd = new FormData();
    fd.set("enabled", "on");
    fd.set("foo", "bar");
    const result = parseUpsReturnsForm(fd);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });
});
