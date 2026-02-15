import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

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
    useModal: () => {
      const ctx = React.useContext(ModalContext);
      if (!ctx) throw new Error("Missing ModalContext Provider in test");
      return ctx;
    },
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

const { ModalContext } = require("@acme/ui/context/ModalContext");
const RoomsSection = require("@/components/rooms/RoomsSection").default as typeof import("@/components/rooms/RoomsSection").default;

describe("GA4 select_item on room CTA clicks (GA4-11)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires select_item before opening booking2 modal on NR click (rooms_index)", () => {
    const openModal = jest.fn();

    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal,
          closeModal: jest.fn(),
        }}
      >
        <RoomsSection
          lang="en"
          itemListId="rooms_index"
          bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
        />
      </ModalContext.Provider>,
    );

    // In this test we mock i18n to return key tokens; the UI RoomCard uses those
    // tokens as aria-labels when they don't look like dotted i18n keys.
    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    const gtag = window.gtag as unknown as jest.Mock;
    const call = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "select_item");
    expect(call).toBeTruthy();
    const payload = call?.[2] as Record<string, unknown>;

    expect(payload).toEqual(
      expect.objectContaining({
        item_list_id: "rooms_index",
        item_list_name: "Rooms index",
        items: [
          expect.objectContaining({
            item_id: expect.any(String),
            item_name: expect.any(String),
            item_variant: "nr",
          }),
        ],
      }),
    );

    expect(openModal).toHaveBeenCalledWith("booking2", expect.any(Object));

    // Ensure analytics is emitted before the modal opens.
    const gtagOrder = (gtag.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY) as number;
    const openOrder = (openModal.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY) as number;
    expect(gtagOrder).toBeLessThan(openOrder);
  });
});
