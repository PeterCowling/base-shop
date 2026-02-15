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
          modalData: { checkIn: "2026-06-10", checkOut: "2026-06-12", adults: 2 },
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <Booking2GlobalModal />
      </ModalContext.Provider>,
    );

    expect(typeof capture.props?.onConfirm).toBe("function");

    capture.props.onConfirm();

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        source: "booking2_modal",
        checkin: "2026-06-10",
        checkout: "2026-06-12",
        pax: 2,
      }),
    );

    expect(mockSetWindowLocationHref).toHaveBeenCalledWith(
      expect.stringContaining("book.octorate.com/octobook/site/reservation/result.xhtml"),
    );
  });
});
