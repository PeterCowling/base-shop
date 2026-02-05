
const importSpy = jest.fn();

jest.mock("swiper", () => {
  importSpy("swiper");
  return { __esModule: true, default: {} };
});
jest.mock("swiper/react", () => {
  importSpy("swiper/react");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/BookingModal", () => {
  importSpy("BookingModal");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/BookingModal2", () => {
  importSpy("BookingModal2");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/LocationModal", () => {
  importSpy("LocationModal");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/ContactModal", () => {
  importSpy("ContactModal");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/OffersModal", () => {
  importSpy("OffersModal");
  return { __esModule: true, default: {} };
});
jest.mock("@acme/ui/organisms/modals/FacilitiesModal", () => {
  importSpy("FacilitiesModal");
  return { __esModule: true, default: {} };
});

beforeEach(() => {
  jest.resetModules();
  importSpy.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("prefetchInteractiveBundles", () => {
  const setConnection = (value: unknown) => {
    try {
      Object.defineProperty(window.navigator, "connection", {
        configurable: true,
        value,
      });
    } catch {
      // ignore when navigator.connection is not configurable in this environment
    }
  };

  it("noops when running without a window", async () => {
    const originalWindow = globalThis.window;
    const globalWithWindow = globalThis as typeof globalThis & { window?: typeof window };
    Reflect.deleteProperty(globalWithWindow, "window");

    try {
      const mod = await import("@/utils/prefetchInteractive");
      expect(mod.default()).toBeUndefined();
      expect(importSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("uses requestIdleCallback when available", async () => {
    setConnection(undefined);
    const ric = jest.fn((cb: () => void) => cb());
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: ric });
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");

    const mod = await import("@/utils/prefetchInteractive");
    await mod.default();
    await Promise.resolve();

    expect(ric).toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
  });

  it("falls back to setTimeout when requestIdleCallback is missing", async () => {
    setConnection(undefined);
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: undefined });
    const setTimeoutSpy = jest.spyOn(window, "setTimeout").mockImplementation((cb: () => void) => {
      cb();
      return 0 as unknown as number;
    });

    const mod = await import("@/utils/prefetchInteractive");
    await mod.default();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
  });

  it("does not prefetch when Save-Data is enabled", async () => {
    setConnection({ saveData: true, effectiveType: "4g" });
    const ric = jest.fn((cb: () => void) => cb());
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: ric });
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");

    const mod = await import("@/utils/prefetchInteractive");
    await mod.default();
    await Promise.resolve();

    expect(ric).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(importSpy).not.toHaveBeenCalled();
  });

  it("does not prefetch on slow connections (2g)", async () => {
    setConnection({ saveData: false, effectiveType: "2g" });
    const ric = jest.fn((cb: () => void) => cb());
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: ric });

    const mod = await import("@/utils/prefetchInteractive");
    await mod.default();
    await Promise.resolve();

    expect(ric).not.toHaveBeenCalled();
    expect(importSpy).not.toHaveBeenCalled();
  });

  it("prefetchInteractiveBundlesNow imports immediately", async () => {
    setConnection(undefined);
    const ric = jest.fn();
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: ric });
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");

    const mod = await import("@/utils/prefetchInteractive");
    await mod.prefetchInteractiveBundlesNow();
    await Promise.resolve();

    expect(ric).not.toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
  });

  it("shouldPrefetchInteractiveBundlesOnIdle matches rooms/book routes across locales", async () => {
    const mod = await import("@/utils/prefetchInteractive");

    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/en/rooms")).toBe(true);
    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/de/zimmer")).toBe(true);
    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/en/book")).toBe(true);
    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/pl/rezerwuj")).toBe(true);

    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/en/experiences")).toBe(false);
    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/en")).toBe(false);
    expect(mod.shouldPrefetchInteractiveBundlesOnIdle("/")).toBe(false);
  });
});
