import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

// @acme/ui/context/ModalContext: stub for any transitive imports; booking2 modal
// was removed in TASK-24 so no Provider is required.
jest.mock("@acme/ui/context/ModalContext", () => ({
  __esModule: true,
  ssrStub: { activeModal: null, modalData: null, openModal: () => {}, closeModal: () => {} },
  useModal: () => ({ activeModal: null, modalData: null, openModal: () => {}, closeModal: () => {} }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

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

  it("fires select_item on NR click (rooms_index)", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="rooms_index"
        bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
      />,
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
  });
});
