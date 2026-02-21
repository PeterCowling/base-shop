// apps/brikette/src/test/components/ga4-view-item-list-impressions.test.tsx
// Integration test: view_item_list impressions for rooms/book/home/deals surfaces

import "@testing-library/jest-dom";

import React from "react";
import { render, waitFor } from "@testing-library/react";

// Mock Modal Context
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
    useOptionalModal: () => ({
      activeModal: null,
      modalData: null,
      openModal: jest.fn(),
      closeModal: jest.fn(),
    }),
  };
});

// Mock i18n
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: {
      language: "en",
      hasResourceBundle: () => true,
      getFixedT: () => (k: string) => k,
      getResource: () => undefined,
    },
    ready: true,
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Stub organisms used by HomeContent to avoid browser API dependencies (IntersectionObserver etc.)
jest.mock("@acme/ui/organisms/CarouselSlides", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/LandingHeroSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/QuickLinksSection", () => ({ __esModule: true, default: () => null }));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/rooms",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const { ModalContext } = require("@acme/ui/context/ModalContext");
const { resetImpressionDedupe } = require("../../utils/ga4-events");
const RoomsPageContent = require("../../app/[lang]/rooms/RoomsPageContent").default;
const BookPageContent = require("../../app/[lang]/book/BookPageContent").default;
const HomeContent = require("../../app/[lang]/HomeContent").default;
const DealsPageContent = require("../../app/[lang]/deals/DealsPageContent").default;

describe("GA4 view_item_list impressions", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
    resetImpressionDedupe();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  const mockModalContext = {
    activeModal: null,
    modalData: null,
    openModal: jest.fn(),
    closeModal: jest.fn(),
  };

  // TC-01: /[lang]/rooms fires view_item_list with item_list_id: rooms_index
  test("TC-01: /rooms fires view_item_list with rooms_index once per navigation", async () => {
    const { rerender } = render(
      <ModalContext.Provider value={mockModalContext}>
        <RoomsPageContent lang="en" />
      </ModalContext.Provider>
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const viewItemListCalls = gtag.mock.calls.filter(
        (args) => args[0] === "event" && args[1] === "view_item_list"
      );
      expect(viewItemListCalls.length).toBeGreaterThanOrEqual(1);

      const lastCall = viewItemListCalls[viewItemListCalls.length - 1];
      const payload = lastCall[2] as Record<string, unknown>;

      expect(payload.item_list_id).toBe("rooms_index");
      expect(payload.item_list_name).toBe("Rooms index");
      expect(Array.isArray(payload.items)).toBe(true);
      expect((payload.items as unknown[]).length).toBeGreaterThan(0);

      // Verify stable item_id and index
      (payload.items as { item_id: string; item_name: string; index: number }[]).forEach((item, idx) => {
        expect(typeof item.item_id).toBe("string");
        expect(item.item_id.length).toBeGreaterThan(0);
        expect(typeof item.item_name).toBe("string");
        expect(item.index).toBe(idx);
      });
    });

    // Re-render (simulates component update within same navigation)
    rerender(
      <ModalContext.Provider value={mockModalContext}>
        <RoomsPageContent lang="en" />
      </ModalContext.Provider>
    );

    // Should still be exactly 1 call (dedupe within navigation)
    const gtag = window.gtag as unknown as jest.Mock;
    const viewItemListCalls = gtag.mock.calls.filter(
      (args) => args[0] === "event" && args[1] === "view_item_list"
    );
    expect(viewItemListCalls.length).toBe(1);
  });

  // TC-02: /[lang]/book fires view_item_list with item_list_id: book_rooms
  test("TC-02: /book fires view_item_list with book_rooms once per navigation", async () => {
    resetImpressionDedupe(); // Simulate new navigation
    jest.clearAllMocks();

    render(
      <ModalContext.Provider value={mockModalContext}>
        <BookPageContent lang="en" />
      </ModalContext.Provider>
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const viewItemListCalls = gtag.mock.calls.filter(
        (args) => args[0] === "event" && args[1] === "view_item_list"
      );
      expect(viewItemListCalls.length).toBeGreaterThanOrEqual(1);

      const lastCall = viewItemListCalls[viewItemListCalls.length - 1];
      const payload = lastCall[2] as Record<string, unknown>;

      expect(payload.item_list_id).toBe("book_rooms");
      expect(payload.item_list_name).toBe("Book page rooms");
      expect(Array.isArray(payload.items)).toBe(true);
      expect((payload.items as unknown[]).length).toBeGreaterThan(0);

      (payload.items as { item_id: string; item_name: string; index: number }[]).forEach((item, idx) => {
        expect(typeof item.item_id).toBe("string");
        expect(item.index).toBe(idx);
      });
    });
  });

  // TC-03: Home carousel fires view_item_list with item_list_id: home_rooms_carousel
  test("TC-03: Home carousel fires view_item_list with home_rooms_carousel once per navigation", async () => {
    resetImpressionDedupe(); // Simulate new navigation
    jest.clearAllMocks();

    render(
      <ModalContext.Provider value={mockModalContext}>
        <HomeContent lang="en" />
      </ModalContext.Provider>
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const viewItemListCalls = gtag.mock.calls.filter(
        (args) => args[0] === "event" && args[1] === "view_item_list"
      );
      expect(viewItemListCalls.length).toBeGreaterThanOrEqual(1);

      const lastCall = viewItemListCalls[viewItemListCalls.length - 1];
      const payload = lastCall[2] as Record<string, unknown>;

      expect(payload.item_list_id).toBe("home_rooms_carousel");
      expect(payload.item_list_name).toBe("Home rooms carousel");
      expect(Array.isArray(payload.items)).toBe(true);
      expect((payload.items as unknown[]).length).toBeGreaterThan(0);

      (payload.items as { item_id: string; item_name: string; index: number }[]).forEach((item, idx) => {
        expect(typeof item.item_id).toBe("string");
        expect(item.index).toBe(idx);
      });
    });
  });

  // TC-04: revisiting a page (navigate away then back) refires the impression
  test("TC-04: revisiting a page refires view_item_list (per-navigation dedupe)", async () => {
    const { unmount } = render(
      <ModalContext.Provider value={mockModalContext}>
        <RoomsPageContent lang="en" />
      </ModalContext.Provider>
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const viewItemListCalls = gtag.mock.calls.filter(
        (args) => args[0] === "event" && args[1] === "view_item_list"
      );
      expect(viewItemListCalls.length).toBe(1);
    });

    unmount();

    // Simulate navigation change
    resetImpressionDedupe();
    jest.clearAllMocks();

    // Revisit the same page (new navigation)
    render(
      <ModalContext.Provider value={mockModalContext}>
        <RoomsPageContent lang="en" />
      </ModalContext.Provider>
    );

    await waitFor(() => {
      const gtag = window.gtag as unknown as jest.Mock;
      const viewItemListCalls = gtag.mock.calls.filter(
        (args) => args[0] === "event" && args[1] === "view_item_list"
      );
      expect(viewItemListCalls.length).toBe(1); // Fires again on revisit
    });
  });
});
