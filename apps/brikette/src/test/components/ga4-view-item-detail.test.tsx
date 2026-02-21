import "@testing-library/jest-dom";

import React from "react";
import { render, waitFor } from "@testing-library/react";

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
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k, getResource: () => null },
    ready: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/en/rooms/room_10",
  useSearchParams: () => new URLSearchParams(),
}));

// Stub @acme/ui/organisms used by ApartmentPageContent and RoomDetailContent
jest.mock("@acme/ui/organisms/ApartmentAmenitiesSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/ApartmentDetailsSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/ApartmentHeroSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/ApartmentHighlightsSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/StickyBookNow", () => ({ __esModule: true, default: () => null }));

// Mock Link component from next/link
jest.mock("next/link", () => {
  function MockLink({ children, href, prefetch: _prefetch, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

const { ModalContext } = require("@acme/ui/context/ModalContext");
const RoomDetailContent = require("@/app/[lang]/rooms/[id]/RoomDetailContent").default as typeof import("@/app/[lang]/rooms/[id]/RoomDetailContent").default;
const ApartmentPageContent = require("@/app/[lang]/apartment/ApartmentPageContent").default as typeof import("@/app/[lang]/apartment/ApartmentPageContent").default;

describe("GA4 view_item on detail pages (GA4-VIEW-ITEM)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("TC-01: room detail page fires view_item with items[0].item_id matching Room.sku", async () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <RoomDetailContent lang="en" id="room_10" />
      </ModalContext.Provider>,
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const call = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "view_item");
      expect(call).toBeTruthy();

      const payload = call?.[2] as Record<string, unknown>;
      expect(payload).toEqual(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              item_id: "room_10",
              item_name: expect.any(String),
            }),
          ],
        }),
      );
    });

    // Ensure no begin_checkout was emitted as a side effect
    const gtag = window.gtag as unknown as jest.Mock;
    const beginCheckoutCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "begin_checkout");
    expect(beginCheckoutCall).toBeUndefined();
  });

  it("TC-02: apartment page fires view_item with items[0].item_id === apartment", async () => {
    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal: jest.fn(),
          closeModal: jest.fn(),
        }}
      >
        <ApartmentPageContent lang="en" />
      </ModalContext.Provider>,
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const call = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "view_item");
      expect(call).toBeTruthy();

      const payload = call?.[2] as Record<string, unknown>;
      expect(payload).toEqual(
        expect.objectContaining({
          items: [
            expect.objectContaining({
              item_id: "apartment",
              item_name: expect.any(String),
            }),
          ],
        }),
      );
    });

    // Ensure no begin_checkout was emitted as a side effect
    const gtag = window.gtag as unknown as jest.Mock;
    const beginCheckoutCall = gtag.mock.calls.find((args) => args[0] === "event" && args[1] === "begin_checkout");
    expect(beginCheckoutCall).toBeUndefined();
  });
});
