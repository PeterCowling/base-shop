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

  it("does not emit when GA_MEASUREMENT_ID is absent", async () => {
    const callbacks: Record<string, (metric: unknown) => void> = {};

    jest.doMock("@/config/env", () => ({
      IS_PROD: true,
      GA_MEASUREMENT_ID: "",
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

  it("does not emit when window.gtag is not defined", async () => {
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

    // Remove gtag from window for this test (beforeEach sets it; delete overrides)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).gtag;

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    // Should not throw even with no gtag present
    expect(() => {
      callbacks["CLS"]?.({
        name: "CLS",
        value: 0.1,
        id: "metric_cls",
        delta: 0,
        rating: "good",
        navigationType: "navigate",
      });
    }).not.toThrow();
  });

  it("emits GA4 web_vitals event for INP metric", async () => {
    const callbacks: Record<string, (metric: unknown) => void> = {};

    jest.doMock("@/config/env", () => ({
      IS_PROD: true,
      GA_MEASUREMENT_ID: "G-TEST",
    }));

    jest.doMock("web-vitals", () => ({
      onCLS: () => {},
      onINP: (cb: (metric: unknown) => void) => {
        callbacks["INP"] = cb;
      },
      onLCP: () => {},
    }));

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    callbacks["INP"]?.({
      name: "INP",
      value: 200,
      id: "metric_inp",
      delta: 50,
      rating: "needs-improvement",
      navigationType: "navigate",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag as jest.Mock;
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "web_vitals",
      expect.objectContaining({
        name: "INP",
        value: 200,
        metric_id: "metric_inp",
        metric_value: 200,
        metric_delta: 50,
        metric_rating: "needs-improvement",
        navigation_type: "navigate",
        non_interaction: true,
      })
    );
  });

  it("swallows errors thrown by gtag without propagating", async () => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag = jest.fn().mockImplementation(() => {
      throw new Error("GA blocked by ad blocker");
    });

    const { initWebVitals } = await import("@/performance/reportWebVitals");
    initWebVitals();

    expect(() => {
      callbacks["CLS"]?.({
        name: "CLS",
        value: 0.05,
        id: "metric_cls_err",
        delta: 0,
        rating: "good",
        navigationType: "navigate",
      });
    }).not.toThrow();
  });
});
