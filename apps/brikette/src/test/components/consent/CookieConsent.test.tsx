import { render } from "@testing-library/react";

// Mock vanilla-cookieconsent before any imports
const mockRun = jest.fn();
const mockReset = jest.fn();
jest.mock("vanilla-cookieconsent", () => ({
  run: mockRun,
  reset: mockReset,
}));

// Mock env module
jest.mock("@/config/env", () => ({
  CONSENT_BANNER: "1",
}));

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import { CookieConsentBanner, updateGtagConsent } from "@/components/consent/CookieConsent";

describe("CookieConsentBanner", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-01: Banner renders on first visit → CookieConsent.run() called with correct categories
  it("initializes vanilla-cookieconsent with analytics and advertising categories", () => {
    render(<CookieConsentBanner />);

    expect(mockRun).toHaveBeenCalledTimes(1);
    const config = mockRun.mock.calls[0][0];
    expect(config.categories).toHaveProperty("necessary");
    expect(config.categories.necessary.readOnly).toBe(true);
    expect(config.categories).toHaveProperty("analytics");
    expect(config.categories).toHaveProperty("advertising");
  });

  // TC-02: Accept All → gtag('consent', 'update') called with all granted
  it("calls gtag consent update with granted when analytics accepted", () => {
    render(<CookieConsentBanner />);

    const config = mockRun.mock.calls[0][0];
    // Simulate onConsent with analytics + advertising accepted
    config.onConsent({ cookie: { categories: ["necessary", "analytics", "advertising"] } });

    expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  // TC-03: Reject All → consent update called with denied
  it("calls gtag consent update with denied when all optional rejected", () => {
    render(<CookieConsentBanner />);

    const config = mockRun.mock.calls[0][0];
    // Simulate onConsent with only necessary accepted
    config.onConsent({ cookie: { categories: ["necessary"] } });

    expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  // TC-04: Consent persisted → onChange fires gtag update on preference change
  it("fires gtag consent update on preference change via onChange", () => {
    render(<CookieConsentBanner />);

    const config = mockRun.mock.calls[0][0];
    // Simulate onChange when user modifies preferences
    config.onChange({ cookie: { categories: ["necessary", "analytics"] } });

    expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  // TC-06: Feature flag off → component does not call CookieConsent.run()
  it("does not initialize when feature flag is off", () => {
    mockRun.mockClear();
    render(<CookieConsentBanner enabledOverride={false} />);

    expect(mockRun).not.toHaveBeenCalled();
  });
});

describe("updateGtagConsent", () => {
  beforeEach(() => {
    window.gtag = jest.fn();
  });

  it("does not throw when gtag is not available", () => {
     
    delete (window as any).gtag;
    expect(() => updateGtagConsent(["analytics"])).not.toThrow();
  });

  it("maps analytics category to analytics_storage granted", () => {
    updateGtagConsent(["necessary", "analytics"]);
    expect(window.gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "granted" }),
    );
  });

  it("maps advertising category to ad_storage, ad_user_data, ad_personalization granted", () => {
    updateGtagConsent(["necessary", "advertising"]);
    expect(window.gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      }),
    );
  });
});
