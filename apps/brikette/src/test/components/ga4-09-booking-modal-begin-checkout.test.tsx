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

describe("BookingGlobalModal GA4 begin_checkout", () => {
  let originalGtag: typeof window.gtag;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-01T00:00:00Z"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires search_availability on BookingModal onAction", () => {
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

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "search_availability",
      expect.objectContaining({
        pax: 2,
        nights: 2,
        lead_time_days: 9,
        source: "unknown",
      }),
    );
  });
});
