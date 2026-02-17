import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

// Jest transform for @acme/ui context can be brittle in app tests; mock to a real React context.
jest.mock("@acme/ui/context/ModalContext", () => {
  const React = require("react");
  const ModalContext = React.createContext(null);
  return {
    __esModule: true,
    ModalContext,
    ssrStub: {
      activeModal: null,
      modalData: null,
      openModal: () => {},
      closeModal: () => {},
    },
  };
});

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const mockSetWindowLocationHref = jest.fn();

jest.mock("@/context/modal/environment", () => ({
  setWindowLocationHref: (href: string) => mockSetWindowLocationHref(href),
}));

const capture: { props?: any } = {};

jest.mock("@/context/modal/lazy-modals", () => ({
  BookingModal: (props: any) => {
    capture.props = props;
    return null;
  },
}));

// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { ModalContext } from "@/context/modal/context";
// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { BookingGlobalModal } from "@/context/modal/global-modals/BookingModal";
// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { resetHandoffDedupe } from "@/utils/ga4-events";

describe("BookingGlobalModal GA4 handoff events (TASK-03)", () => {
  let originalGtag: typeof window.gtag;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetHandoffDedupe();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("TC-01/TC-04: fires handoff_to_engine same_tab (primary) and search_availability (compat) on onAction", () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: "booking",
          modalData: null,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <BookingGlobalModal />
      </ModalContext.Provider>,
    );

    expect(typeof capture.props?.onAction).toBe("function");

    capture.props.onAction({
      checkIn: new Date("2026-06-10T00:00:00Z"),
      checkOut: new Date("2026-06-12T00:00:00Z"),
      guests: 2,
    });

    const gtag = window.gtag as unknown as jest.Mock;

    // TC-01 + TC-04: canonical handoff_to_engine fires with same_tab + beacon transport.
    const handoffCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "handoff_to_engine");
    expect(handoffCall).toBeTruthy();
    const handoffPayload = handoffCall?.[2] as Record<string, unknown>;

    expect(handoffPayload).toEqual(
      expect.objectContaining({
        handoff_mode: "same_tab",
        engine_endpoint: "result",
        checkin: "2026-06-10",
        checkout: "2026-06-12",
        pax: 2,
        transport_type: "beacon",
      }),
    );

    // Navigation is beacon-driven (same-tab); must not navigate before event_callback fires.
    expect(mockSetWindowLocationHref).not.toHaveBeenCalled();
    expect(typeof handoffPayload.event_callback).toBe("function");
    (handoffPayload.event_callback as () => void)();
    expect(mockSetWindowLocationHref).toHaveBeenCalledWith(
      expect.stringContaining("book.octorate.com/octobook/site/reservation/result.xhtml"),
    );

    // Compat: search_availability still fires during migration window (no beacon).
    const searchCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "search_availability");
    expect(searchCall).toBeTruthy();
    const searchPayload = searchCall?.[2] as Record<string, unknown>;
    expect(searchPayload).toEqual(
      expect.objectContaining({
        pax: 2,
        nights: 2,
        lead_time_days: 9,
        source: "unknown",
      }),
    );
  });

  it("TC-01: dedupe prevents double-firing handoff_to_engine on rapid double-click", () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: "booking",
          modalData: null,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <BookingGlobalModal />
      </ModalContext.Provider>,
    );

    capture.props.onAction({
      checkIn: new Date("2026-07-01T00:00:00Z"),
      checkOut: new Date("2026-07-03T00:00:00Z"),
      guests: 1,
    });
    capture.props.onAction({
      checkIn: new Date("2026-07-01T00:00:00Z"),
      checkOut: new Date("2026-07-03T00:00:00Z"),
      guests: 1,
    }); // rapid second call

    const gtag = window.gtag as unknown as jest.Mock;
    const handoffCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "handoff_to_engine");
    expect(handoffCalls).toHaveLength(1); // deduped — only one fires
  });
});
