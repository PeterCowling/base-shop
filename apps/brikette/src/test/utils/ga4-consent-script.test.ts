import { buildGA4InlineScript } from "@/utils/ga4-consent-script";

describe("buildGA4InlineScript", () => {
  const MEASUREMENT_ID = "G-TEST123";

  // TC-01: Consent defaults run before gtag config
  it("places consent defaults before gtag config", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });

    const consentIdx = script.indexOf("gtag('consent', 'default'");
    const configIdx = script.indexOf(`gtag('config', '${MEASUREMENT_ID}'`);

    expect(consentIdx).toBeGreaterThan(-1);
    expect(configIdx).toBeGreaterThan(-1);
    expect(consentIdx).toBeLessThan(configIdx);
  });

  // TC-01 continued: All 4 consent parameters are present
  it("includes all 4 Consent Mode v2 parameters denied by default", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });

    expect(script).toContain("ad_storage: 'denied'");
    expect(script).toContain("ad_user_data: 'denied'");
    expect(script).toContain("ad_personalization: 'denied'");
    expect(script).toContain("analytics_storage: 'denied'");
  });

  // TC-01: wait_for_update is set for CMP integration
  it("includes wait_for_update for CMP integration", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });
    expect(script).toContain("wait_for_update: 500");
  });

  // TC-02: dataLayer and gtag function are defined
  it("initializes dataLayer and gtag function", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });

    expect(script).toContain("window.dataLayer = window.dataLayer || [];");
    expect(script).toContain("function gtag(){dataLayer.push(arguments);}");
  });

  // TC-02: gtag('js', ...) is present
  it("includes gtag js timestamp", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });
    expect(script).toContain("gtag('js', new Date());");
  });

  // TC-02: gtag config uses the provided measurement ID
  it("configures the correct measurement ID", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });
    expect(script).toContain(`gtag('config', '${MEASUREMENT_ID}');`);
  });

  // TC-01 (internal traffic): adds traffic_type when isInternalTraffic
  it("adds traffic_type internal when flagged", () => {
    const script = buildGA4InlineScript({
      measurementId: MEASUREMENT_ID,
      isInternalTraffic: true,
    });
    expect(script).toContain("traffic_type: 'internal'");
  });

  // TC-02 (no internal traffic): omits traffic_type by default
  it("omits traffic_type when not flagged", () => {
    const script = buildGA4InlineScript({ measurementId: MEASUREMENT_ID });
    expect(script).not.toContain("traffic_type");
  });
});
