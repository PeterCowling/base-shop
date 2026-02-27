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
    jest.useFakeTimers();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  it("fires select_item on NR click (rooms_index)", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="rooms_index"
        queryState="valid"
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

// TASK-32: RoomsSection.onRoomSelect — full GA4 item fields + trackThenNavigate for begin_checkout
describe("TASK-32: RoomsSection onRoomSelect GA4 contracts", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;
  let originalLocationAssign: typeof window.location.assign;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
    // Mock window.location.assign to capture navigation calls
    originalLocationAssign = window.location.assign;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: jest.fn(), href: "" },
    });
  });

  afterEach(() => {
    window.gtag = originalGtag;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: originalLocationAssign },
    });
    jest.useRealTimers();
  });

  // TC-01: select_item fires with full GA4 item shape (item_category, affiliation, currency)
  it("TC-01: select_item fires with item_category, affiliation, currency in items[]", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    const selectItemCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_item",
    );
    expect(selectItemCall).toBeTruthy();
    const payload = selectItemCall?.[2] as Record<string, unknown>;
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items[0]).toMatchObject({
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
      item_variant: "nr",
    });
  });

  // TC-02 + TC-04: begin_checkout fires via trackThenNavigate with transport_type beacon
  it("TC-02/TC-04: begin_checkout fires via trackThenNavigate with transport_type beacon and event_callback", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    const beginCheckoutCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutCall).toBeTruthy();
    const payload = beginCheckoutCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({ transport_type: "beacon" });
    expect(payload).toHaveProperty("event_callback");
    expect(typeof payload.event_callback).toBe("function");
  });

  // TC-03: navigation occurs via window.location.assign inside the navigate callback
  it("TC-03: window.location.assign is called via event_callback (not immediately)", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
      />,
    );

    const assignMock = window.location.assign as jest.Mock;
    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    // Immediately after click, assign should NOT have been called (beacon pending)
    expect(assignMock).not.toHaveBeenCalled();

    // Fire the event_callback (simulates GA4 beacon dispatched)
    const beginCheckoutCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    const eventCallback = (beginCheckoutCall?.[2] as Record<string, unknown>)?.event_callback as () => void;
    eventCallback();

    // Now assign should have been called with an Octorate URL
    expect(assignMock).toHaveBeenCalledTimes(1);
    const url = (assignMock as jest.Mock).mock.calls[0][0] as string;
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });

  it("TC-06: room CTA navigation uses result endpoint with room/date params and no legacy confirm params", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-07-01", checkOut: "2026-07-04", pax: "1", queryString: "" }}
      />,
    );

    const assignMock = window.location.assign as jest.Mock;
    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    const beginCheckoutCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    const eventCallback = (beginCheckoutCall?.[2] as Record<string, unknown>)?.event_callback as () => void;
    eventCallback();

    expect(assignMock).toHaveBeenCalledTimes(1);

    const targetUrl = (assignMock as jest.Mock).mock.calls[0][0] as string;
    const parsed = new URL(targetUrl);

    expect(parsed.origin + parsed.pathname).toBe(
      "https://book.octorate.com/octobook/site/reservation/result.xhtml",
    );
    expect(parsed.searchParams.get("codice")).toBe("45111");
    expect(parsed.searchParams.get("adulti")).toBe("1");
    expect(parsed.searchParams.get("checkin")).toBe("2026-07-01");
    expect(parsed.searchParams.get("checkout")).toBe("2026-07-04");
    expect(parsed.searchParams.get("date")).toBe("2026-07-01");
    expect(parsed.searchParams.get("room")).toMatch(/^\d+$/u);

    // Regression guard: do not reintroduce legacy confirm/deep-link params.
    expect(targetUrl).not.toContain("/confirm.xhtml");
    expect(parsed.searchParams.get("pax")).toBe("1");
    expect(parsed.searchParams.has("children")).toBe(false);
    expect(parsed.searchParams.has("childrenAges")).toBe(false);
  });

  // TC-05: second click while isNavigating=true → no duplicate GA4 events
  it("TC-05: second click while navigating is ignored (no duplicate GA4 events)", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-06-10", checkOut: "2026-06-12", pax: "2", queryString: "" }}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });

    // First click — sets isNavigating = true
    fireEvent.click(buttons[0]);

    const countAfterFirst = gtagMock.mock.calls.length;

    // Second click — should be ignored by the isNavigating guard
    fireEvent.click(buttons[0]);

    expect(gtagMock.mock.calls.length).toBe(countAfterFirst);
  });

  it("TC-07: pageshow resets navigation guard so CTA works after back navigation (TC-07)", () => {
    render(
      <RoomsSection
        lang="en"
        itemListId="book_rooms"
        queryState="valid"
        bookingQuery={{ checkIn: "2026-07-28", checkOut: "2026-07-31", pax: "2", queryString: "" }}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /checkRatesNonRefundable/i });
    fireEvent.click(buttons[0]);

    const beginCheckoutEventsAfterFirst = gtagMock.mock.calls.filter(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutEventsAfterFirst).toHaveLength(1);

    // Simulate returning to the page from browser back/forward cache.
    window.dispatchEvent(new Event("pageshow"));

    fireEvent.click(buttons[0]);
    const beginCheckoutEventsAfterReturn = gtagMock.mock.calls.filter(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutEventsAfterReturn).toHaveLength(2);
  });
});

// TASK-05: Best Rate Guarantee badge — regression guard for PriceBlock badge rendering.
// Imports the real UI RoomCard from source (bypassing the @acme/ui/molecules stub) to verify
// that price.badge is rendered as an accessible link in the card content area.
describe("TASK-05: Best Rate Guarantee badge — PriceBlock renders badge text", () => {
  it("TC-TASK05-03: badge link is rendered when price.badge is set on UI RoomCard", () => {
    // Require the real UI RoomCard directly from source, bypassing the @acme/ui/molecules stub.
    // The organisms RoomsSection uses this same relative-import path in its test run without issues.
    const { RoomCard: UiRoomCard } = require("../../../../../packages/ui/src/molecules/RoomCard") as {
      RoomCard: React.ComponentType<{
        id: string;
        title: string;
        imageAlt: string;
        price?: { badge?: { text: string; claimUrl: string } };
      }>;
    };

    render(
      <UiRoomCard
        id="test-room"
        title="Test Room"
        imageAlt="Test room"
        price={{ badge: { text: "Best price guaranteed", claimUrl: "https://wa.me/393287073695" } }}
      />,
    );

    // Badge renders as an <a> whose accessible name excludes the aria-hidden ✓ span
    expect(screen.getByRole("link", { name: "Best price guaranteed" })).toBeInTheDocument();
  });
});
