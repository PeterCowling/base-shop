import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import StickyBookNow from "@acme/ui/organisms/StickyBookNow";

import { fireSearchAvailabilityAndNavigate } from "@/utils/ga4-events";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));


describe("GA4 search_availability on StickyBookNow (GA4-sticky)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    // doNotFake queueMicrotask so React 18's scheduler can still batch state
    // updates from useEffect (e.g. setUrlParams). setTimeout is still faked so
    // we can advance the navigation fallback timer deterministically.
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    jest.setSystemTime(new Date("2026-02-15T12:00:00Z"));

    originalGtag = window.gtag;
    window.gtag = jest.fn();

    window.history.pushState(
      {},
      "",
      "/en/rooms/room_10?checkin=2026-06-10&checkout=2026-06-12&pax=2",
    );
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  it("fires search_availability once and delays same-tab navigation until timeout fallback", () => {
    const onNavigate = jest.fn();

    render(
      <StickyBookNow
        lang="en"
        onStickyCheckoutClick={(ctx) =>
          fireSearchAvailabilityAndNavigate({
            source: "sticky_cta",
            checkin: ctx.checkin,
            checkout: ctx.checkout,
            pax: ctx.pax,
            // In this test we intentionally avoid calling `ctx.proceed()` (real navigation),
            // and instead assert the outbound reliability delay via `onNavigate`.
            onNavigate,
          })
        }
      />,
    );

    const link = screen.getByRole("link");
    fireEvent.click(link);

    const gtag = window.gtag as unknown as jest.Mock;
    const searchAvailabilityCalls = gtag.mock.calls.filter(
      (args) => args[0] === "event" && args[1] === "search_availability",
    );
    expect(searchAvailabilityCalls).toHaveLength(1);
    expect(searchAvailabilityCalls[0]?.[2]).toEqual(
      expect.objectContaining({
        source: "sticky_cta",
        pax: 2,
        nights: 2,
        lead_time_days: expect.any(Number),
        transport_type: "beacon",
        event_callback: expect.any(Function),
      }),
    );

    const beginCheckoutCalls = gtag.mock.calls.filter(
      (args) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutCalls).toHaveLength(0);

    expect(onNavigate).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(149);
    expect(onNavigate).toHaveBeenCalledTimes(0);
    jest.advanceTimersByTime(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
