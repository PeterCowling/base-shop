import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

// next/navigation: allow per-test useSearchParams control via module-level variable.
// jest.mock is hoisted; the factory closure reads mockSearchParams at call time (render),
// not at hoist time, so per-test mutation is safe.
let mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/en/book",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));
jest.mock("@/components/seo/BookPageStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/DirectPerksBlock", () => ({ DirectPerksBlock: () => null }));
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/SocialProofSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/FaqStrip", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/rooms/RoomsSection", () => ({ __esModule: true, default: () => null }));

const BookPageContent = require("@/app/[lang]/book/BookPageContent")
  .default as typeof import("@/app/[lang]/book/BookPageContent").default;

describe("TASK-33: BookPageContent search_availability GA4 contract", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-18T12:00:00Z"));
    mockSearchParams = new URLSearchParams();
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: Changing dates fires search_availability after debounce.
  // Payload must not include raw date strings (nights/lead_time_days only).
  it("TC-01: changing dates fires search_availability after debounce with nights/lead_time_days/pax", () => {
    render(<BookPageContent lang="en" />);

    const checkinInput = screen.getByLabelText(/check in/i);
    const checkoutInput = screen.getByLabelText(/check out/i);

    fireEvent.change(checkinInput, { target: { value: "2026-06-10" } });
    fireEvent.change(checkoutInput, { target: { value: "2026-06-12" } });

    // No fire yet — debounce pending
    expect(
      gtagMock.mock.calls.filter((args: unknown[]) => args[1] === "search_availability"),
    ).toHaveLength(0);

    jest.advanceTimersByTime(600);

    const searchCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "search_availability",
    );
    expect(searchCall).toBeTruthy();
    const payload = searchCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({
      source: "booking_widget",
      nights: expect.any(Number),
      lead_time_days: expect.any(Number),
      pax: expect.any(Number),
    });
    // Must not forward raw date strings (verified in ga4-events-contract.test.ts TC-04)
    expect(payload).not.toHaveProperty("checkin");
    expect(payload).not.toHaveProperty("checkout");
  });

  // TC-02: Mount with no URL params does not fire search_availability (even after debounce).
  it("TC-02: mount with no URL params does not fire search_availability", () => {
    mockSearchParams = new URLSearchParams();
    render(<BookPageContent lang="en" />);

    jest.advanceTimersByTime(1000);

    const searchCalls = gtagMock.mock.calls.filter(
      (args: unknown[]) => args[0] === "event" && args[1] === "search_availability",
    );
    expect(searchCalls).toHaveLength(0);
  });

  // TC-03: Mount with valid URL params fires search_availability exactly once.
  it("TC-03: mount with valid URL params fires search_availability exactly once", () => {
    mockSearchParams = new URLSearchParams("checkin=2026-06-10&checkout=2026-06-12&pax=2");
    render(<BookPageContent lang="en" />);

    const searchCalls = gtagMock.mock.calls.filter(
      (args: unknown[]) => args[0] === "event" && args[1] === "search_availability",
    );
    expect(searchCalls).toHaveLength(1);
    const payload = searchCalls[0]?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({
      source: "booking_widget",
      nights: 2,
      pax: 2,
    });
  });
});
