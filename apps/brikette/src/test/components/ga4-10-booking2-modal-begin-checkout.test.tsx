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

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { loadNamespaces: jest.fn() },
}));

const mockSetWindowLocationHref = jest.fn();

jest.mock("@/context/modal/environment", () => ({
  setWindowLocationHref: (href: string) => mockSetWindowLocationHref(href),
}));

const capture: { props?: any } = {};

jest.mock("@/context/modal/lazy-modals", () => ({
  BookingModal2: (props: any) => {
    capture.props = props;
    return null;
  },
}));

// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { ModalContext } from "@/context/modal/context";
// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { Booking2GlobalModal } from "@/context/modal/global-modals/Booking2Modal";
// eslint-disable-next-line import/first -- mocks must be declared before import under test
import { resetHandoffDedupe } from "@/utils/ga4-events";

describe("Booking2GlobalModal GA4 handoff events (TASK-05A)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    resetHandoffDedupe();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires handoff_to_engine (primary) and begin_checkout (compat) on room-selected confirm", () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: "booking2",
          modalData: {
            checkIn: "2026-06-10",
            checkOut: "2026-06-12",
            adults: 2,
            roomSku: "room_10",
            plan: "flex",
            octorateRateCode: "433898",
            source: "room_card",
            item_list_id: "rooms_index",
          },
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <Booking2GlobalModal />
      </ModalContext.Provider>,
    );

    expect(typeof capture.props?.onConfirm).toBe("function");

    capture.props.onConfirm();

    const gtag = window.gtag as unknown as jest.Mock;

    // TC-01: canonical handoff_to_engine fires with all required params + beacon transport.
    const handoffCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "handoff_to_engine");
    expect(handoffCall).toBeTruthy();
    const handoffPayload = handoffCall?.[2] as Record<string, unknown>;

    expect(handoffPayload).toEqual(
      expect.objectContaining({
        handoff_mode: "same_tab",
        engine_endpoint: "confirm",
        checkin: "2026-06-10",
        checkout: "2026-06-12",
        pax: 2,
        transport_type: "beacon",
      }),
    );

    // Navigation is driven by handoff_to_engine callback (beacon reliability).
    expect(mockSetWindowLocationHref).not.toHaveBeenCalled();
    expect(typeof handoffPayload.event_callback).toBe("function");
    (handoffPayload.event_callback as () => void)();
    expect(mockSetWindowLocationHref).toHaveBeenCalledWith(
      expect.stringContaining("book.octorate.com/octobook/site/reservation/confirm.xhtml"),
    );

    // TC-01: compat begin_checkout still fires (migration window, no beacon — see TASK-05B).
    const checkoutCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "begin_checkout");
    expect(checkoutCall).toBeTruthy();
    const checkoutPayload = checkoutCall?.[2] as Record<string, unknown>;

    expect(checkoutPayload).toEqual(
      expect.objectContaining({
        checkin: "2026-06-10",
        checkout: "2026-06-12",
        pax: 2,
        items: [
          expect.objectContaining({
            item_id: "room_10",
            item_name: "room_10",
            item_variant: "flex",
          }),
        ],
      }),
    );
    // Compat fire has no beacon wrapper (navigation is driven by handoff_to_engine).
    expect(checkoutPayload).not.toHaveProperty("transport_type");
    expect(checkoutPayload).not.toHaveProperty("event_callback");
  });

  // TC-02: dedupe prevents double-firing within 300ms.
  it("does not double-fire handoff_to_engine if confirm is called twice in rapid succession", () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: "booking2",
          modalData: {
            checkIn: "2026-07-01",
            checkOut: "2026-07-03",
            adults: 1,
            roomSku: "room_11",
            plan: "nr",
            octorateRateCode: "999",
            source: "room_card",
          },
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <Booking2GlobalModal />
      </ModalContext.Provider>,
    );

    capture.props.onConfirm();
    capture.props.onConfirm(); // rapid second call

    const gtag = window.gtag as unknown as jest.Mock;
    const handoffCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "handoff_to_engine");
    expect(handoffCalls).toHaveLength(1); // deduped — only one fires
  });
});
