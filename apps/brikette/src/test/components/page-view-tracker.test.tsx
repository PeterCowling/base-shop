import "@testing-library/jest-dom";

import React from "react";
import { act, render } from "@testing-library/react";

import { PageViewTracker } from "@/components/analytics/PageViewTracker";

// Mock next/navigation — start on /en
let mockPathname = "/en";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock @/config/env (avoids import.meta)
jest.mock("@/config/env", () => ({
  GA_MEASUREMENT_ID: "G-TESTID123",
  IS_PROD: true,
}));

describe("PageViewTracker (GA4 TASK-41, Pattern B)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    mockPathname = "/en";
    originalGtag = window.gtag;
    window.gtag = jest.fn();
    window.history.pushState({}, "", "/en");
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-02: must NOT fire page_view on initial render
  it("TC-02: does not fire gtag on initial render (hard-load page_view is handled by inline snippet)", () => {
    act(() => {
      render(<PageViewTracker />);
    });

    const gtag = window.gtag as unknown as jest.Mock;
    const configCalls = gtag.mock.calls.filter(
      (args: unknown[]) => args[0] === "config" && args[1] === "G-TESTID123",
    );
    expect(configCalls).toHaveLength(0);
  });

  // TC-01: fires page_view with updated page_path on pathname change
  it("TC-01: fires gtag('config', ...) with updated page_path on SPA navigation", () => {
    const { rerender } = render(<PageViewTracker />);

    // Simulate SPA navigation from /en to /en/book
    window.history.pushState({}, "", "/en/book");
    mockPathname = "/en/book";
    act(() => {
      rerender(<PageViewTracker />);
    });

    const gtag = window.gtag as unknown as jest.Mock;
    const configCalls = gtag.mock.calls.filter(
      (args: unknown[]) => args[0] === "config" && args[1] === "G-TESTID123",
    );
    expect(configCalls).toHaveLength(1);
    const payload = configCalls[0]?.[2] as Record<string, unknown>;
    expect(payload).toEqual(
      expect.objectContaining({
        page_path: "/en/book",
      }),
    );
    expect(payload).toHaveProperty("page_location");
  });

  // TC-01 extended: fires on each subsequent navigation
  it("fires on each subsequent navigation — not deduplicated across route changes", () => {
    const { rerender } = render(<PageViewTracker />);

    window.history.pushState({}, "", "/en/book");
    mockPathname = "/en/book";
    act(() => {
      rerender(<PageViewTracker />);
    });

    window.history.pushState({}, "", "/en/rooms");
    mockPathname = "/en/rooms";
    act(() => {
      rerender(<PageViewTracker />);
    });

    const gtag = window.gtag as unknown as jest.Mock;
    const configCalls = gtag.mock.calls.filter(
      (args: unknown[]) => args[0] === "config" && args[1] === "G-TESTID123",
    );
    expect(configCalls).toHaveLength(2);
    expect((configCalls[0]?.[2] as Record<string, unknown>)?.page_path).toBe("/en/book");
    expect((configCalls[1]?.[2] as Record<string, unknown>)?.page_path).toBe("/en/rooms");
  });

  // Guard: does not throw when window.gtag is not available
  it("noops gracefully when window.gtag is not available", () => {
    (window as Window & { gtag?: unknown }).gtag = undefined;
    const { rerender } = render(<PageViewTracker />);

    expect(() => {
      mockPathname = "/en/book";
      act(() => {
        rerender(<PageViewTracker />);
      });
    }).not.toThrow();
  });
});
