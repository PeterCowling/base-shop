import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importSpy = vi.fn();

vi.mock("swiper", () => {
  importSpy("swiper");
  return { __esModule: true, default: {} };
});
vi.mock("swiper/react", () => {
  importSpy("swiper/react");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/BookingModal", () => {
  importSpy("BookingModal");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/BookingModal2", () => {
  importSpy("BookingModal2");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/LocationModal", () => {
  importSpy("LocationModal");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/ContactModal", () => {
  importSpy("ContactModal");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/OffersModal", () => {
  importSpy("OffersModal");
  return { __esModule: true, default: {} };
});
vi.mock("@acme/ui/organisms/modals/FacilitiesModal", () => {
  importSpy("FacilitiesModal");
  return { __esModule: true, default: {} };
});

beforeEach(() => {
  vi.resetModules();
  importSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("prefetchInteractiveBundles", () => {
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
    const ric = vi.fn((cb: () => void) => cb());
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: ric });
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    const mod = await import("@/utils/prefetchInteractive");
    await mod.default();
    await Promise.resolve();

    expect(ric).toHaveBeenCalled();
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
  });

  it("falls back to setTimeout when requestIdleCallback is missing", async () => {
    Object.defineProperty(window, "requestIdleCallback", { writable: true, value: undefined });
    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((cb: () => void) => {
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
});