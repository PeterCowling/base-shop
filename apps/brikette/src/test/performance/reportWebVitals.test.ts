describe("initWebVitals (GA4 web_vitals emission)", () => {
  beforeEach(() => {
    jest.resetModules();
    // Ensure per-test isolation for window.gtag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = jest.fn();
  });

  it("registers web-vitals callbacks and emits GA4 web_vitals events in prod when GA is configured", async () => {
    const callbacks: Record<string, (metric: unknown) => void> = {};

    jest.doMock("@/config/env", () => ({
      IS_PROD: true,
      GA_MEASUREMENT_ID: "G-TEST",
    }));

    jest.doMock("web-vitals", () => ({
      onCLS: (cb: (metric: unknown) => void) => {
        callbacks["CLS"] = cb;
      },
      onINP: (cb: (metric: unknown) => void) => {
        callbacks["INP"] = cb;
      },
      onLCP: (cb: (metric: unknown) => void) => {
        callbacks["LCP"] = cb;
      },
    }));

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    expect(typeof callbacks["LCP"]).toBe("function");
    expect(typeof callbacks["CLS"]).toBe("function");
    expect(typeof callbacks["INP"]).toBe("function");

    const metric = {
      name: "LCP",
      value: 1234.56,
      id: "metric_1",
      delta: 0,
      rating: "good",
      navigationType: "navigate",
    };

    callbacks["LCP"]?.(metric);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag as jest.Mock;
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "web_vitals",
      expect.objectContaining({
        name: "LCP",
        value: 1235, // GA4 prefers integers; LCP is rounded
        metric_id: "metric_1",
        metric_value: 1234.56,
        metric_delta: 0,
        metric_rating: "good",
        navigation_type: "navigate",
        non_interaction: true,
      })
    );
  });

  it("scales CLS by 1000 before rounding", async () => {
    const callbacks: Record<string, (metric: unknown) => void> = {};

    jest.doMock("@/config/env", () => ({
      IS_PROD: true,
      GA_MEASUREMENT_ID: "G-TEST",
    }));

    jest.doMock("web-vitals", () => ({
      onCLS: (cb: (metric: unknown) => void) => {
        callbacks["CLS"] = cb;
      },
      onINP: () => {},
      onLCP: () => {},
    }));

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    const metric = {
      name: "CLS",
      value: 0.1234,
      id: "metric_cls",
      delta: 0,
      rating: "good",
      navigationType: "navigate",
    };

    callbacks["CLS"]?.(metric);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag as jest.Mock;
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "web_vitals",
      expect.objectContaining({
        name: "CLS",
        value: 123, // round(0.1234 * 1000)
      })
    );
  });

  it("does not emit in non-prod environments", async () => {
    const callbacks: Record<string, (metric: unknown) => void> = {};

    jest.doMock("@/config/env", () => ({
      IS_PROD: false,
      GA_MEASUREMENT_ID: "G-TEST",
    }));

    jest.doMock("web-vitals", () => ({
      onCLS: (cb: (metric: unknown) => void) => {
        callbacks["CLS"] = cb;
      },
      onINP: () => {},
      onLCP: () => {},
    }));

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    callbacks["CLS"]?.({
      name: "CLS",
      value: 0.1,
      id: "metric_cls",
      delta: 0,
      rating: "good",
      navigationType: "navigate",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag as jest.Mock;
    expect(gtag).not.toHaveBeenCalled();
  });
});

