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

describe("Booking2GlobalModal GA4 begin_checkout", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires begin_checkout on confirm", () => {
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
    const call = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "begin_checkout");
    expect(call).toBeTruthy();
    const payload = call?.[2] as Record<string, unknown>;

    expect(payload).toEqual(
      expect.objectContaining({
        checkin: "2026-06-10",
        checkout: "2026-06-12",
        pax: 2,
        transport_type: "beacon",
        items: [
          expect.objectContaining({
            item_id: "room_10",
            item_name: "room_10",
            item_variant: "flex",
          }),
        ],
      })
    );

    expect(payload).not.toHaveProperty("value");
    expect(payload).not.toHaveProperty("currency");

    // Navigation is delayed until the GA callback or a short timeout.
    expect(mockSetWindowLocationHref).not.toHaveBeenCalled();
    expect(typeof payload.event_callback).toBe("function");
    (payload.event_callback as () => void)();
    expect(mockSetWindowLocationHref).toHaveBeenCalledWith(
      expect.stringContaining("book.octorate.com/octobook/site/reservation/confirm.xhtml"),
    );
  });
});
