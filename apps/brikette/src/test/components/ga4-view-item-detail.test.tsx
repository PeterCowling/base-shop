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
const RoomDetailContent = require("@/app/[lang]/dorms/[id]/RoomDetailContent").default as typeof import("@/app/[lang]/dorms/[id]/RoomDetailContent").default;
const ApartmentPageContent = require("@/app/[lang]/private-rooms/ApartmentPageContent").default as typeof import("@/app/[lang]/private-rooms/ApartmentPageContent").default;

const APARTMENT_PAGE_PROPS: React.ComponentProps<typeof ApartmentPageContent> = {
  amenities: {
    heading: "Amenities",
    imageAlt: "Amenities image",
    items: ["Wi-Fi", "Kitchen"],
  },
  body: "Apartment body copy",
  details: {
    ctaLabel: "Book apartment",
    heading: "Details",
    items: ["Sleeps 4", "Private bathroom"],
  },
  directSavings: {
    eyebrow: "Direct savings",
    flex: {
      detail: "Flexible detail",
      label: "Flexible",
      saving: "Save 5%",
    },
    heading: "Save when you book direct",
    nr: {
      detail: "Non-refundable detail",
      label: "Non-refundable",
      saving: "Save 10%",
    },
  },
  fitCheck: {
    heading: "Fit check",
    topics: [
      { label: "Arrival", text: "Easy arrival" },
      { label: "Inside", text: "Spacious layout" },
      { label: "Sleeping", text: "Comfortable beds" },
      { label: "Sound", text: "Quiet at night" },
      { label: "Best fit", text: "Great for groups" },
    ],
  },
  gallery: {
    altFallback: "Apartment gallery image",
    alts: ["Gallery image 1", "Gallery image 2", "Gallery image 3"],
    captions: ["Caption 1", "Caption 2", "Caption 3"],
    heading: "Gallery",
  },
  hero: {
    ctaLabel: "Reserve now",
    imageAlt: "Apartment hero image",
    intro: "Apartment intro",
    tagline: "Private apartment",
    title: "Sea-view apartment",
  },
  highlights: {
    sectionTitle: "Highlights",
    slides: [
      { alt: "Highlight 1", text: "Highlight text 1", title: "Highlight 1" },
      { alt: "Highlight 2", text: "Highlight text 2", title: "Highlight 2" },
      { alt: "Highlight 3", text: "Highlight text 3", title: "Highlight 3" },
    ],
  },
  hubCards: {
    privateStay: {
      cta: "Explore private stay",
      href: "/en/private-rooms/private-stay/",
      subtitle: "Private stay subtitle",
      title: "Private stay",
    },
    streetLevel: {
      cta: "Explore street level arrival",
      href: "/en/private-rooms/street-level-arrival/",
      subtitle: "Street level subtitle",
      title: "Street level arrival",
    },
  },
  lang: "en",
  primaryCtas: {
    checkAvailabilityLabel: "Check availability",
    whatsappLabel: "WhatsApp us",
  },
  privateBookingPath: "/en/book-private-accommodations",
};

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
        <ApartmentPageContent {...APARTMENT_PAGE_PROPS} />
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
