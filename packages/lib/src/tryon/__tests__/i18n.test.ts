import { t } from "../i18n";

jest.mock(
  "@acme/i18n/en.json",
  () => ({
    __esModule: true,
    default: {
      "tryon.circuitBreaker.timeout": "Timeout.",
      "tryon.providers.cloudflare.fetchFailed": "Failed to fetch image ({status}).",
      "tryon.providers.cloudflare.upstreamError": "Upstream {status}.",
      "tryon.providers.cloudflare.originNotAllowed": "Origin not allowed.",
      "tryon.providers.cloudflare.noImageInJson": "No image in JSON.",
      "tryon.providers.garment.heavyApiUrlMissing": "TRYON_HEAVY_API_URL not set.",
      "tryon.providers.garment.upstreamError": "Upstream {status}.",
      "tryon.providers.garment.unexpectedResponse": "Unexpected upstream response.",
    },
  }),
  { virtual: true }
);

describe("t", () => {
  it("returns the translated string when present", () => {
    expect(t("tryon.circuitBreaker.timeout")).toBe("Timeout.");
  });

  it("substitutes variables in templates", () => {
    expect(t("tryon.providers.cloudflare.fetchFailed", { status: 404 })).toBe("Failed to fetch image (404).");
  });

  it("falls back to the key when the translation is missing", () => {
    expect(t("missing.key" as never)).toBe("missing.key");
  });

  it("keeps placeholders intact when no matching variable is supplied", () => {
    expect(t("tryon.providers.cloudflare.upstreamError", { other: 500 })).toBe("Upstream {status}.");
  });

  it("stringifies provided values", () => {
    expect(t("tryon.providers.cloudflare.upstreamError", { status: true })).toBe("Upstream true.");
  });

  it("preserves placeholders when a variable is explicitly undefined", () => {
    expect(t("tryon.providers.cloudflare.upstreamError", { status: undefined })).toBe("Upstream {status}.");
  });
});
