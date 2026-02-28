import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/rooms/room_10",
}));

jest.mock("next/link", () => {
  function MockLink({ children, href, prefetch: _p, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean }) {
    return <a href={href} {...props}>{children}</a>;
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));
jest.mock("@/components/seo/RoomStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/rooms/RoomCard", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/molecules", () => ({ DirectBookingPerks: () => null }));
jest.mock("@/i18n", () => ({ __esModule: true, default: { getResource: () => "", getFixedT: () => (k: string) => k } }));
jest.mock("@/routes.guides-helpers", () => ({ guideHref: () => "/" }));
jest.mock("@/utils/translationFallbacks", () => ({ getGuideLinkLabel: () => "Guide" }));

// Mock StickyBookNow to call onStickyCheckoutClick with a mock ctx on click.
// Note: project uses data-cy as testIdAttribute (jest.setup.ts configure({ testIdAttribute: "data-cy" })).
let capturedProceed: jest.Mock | null = null;
let capturedOctorateUrl: string | undefined = undefined;
jest.mock("@acme/ui/organisms/StickyBookNow", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      onStickyCheckoutClick,
      octorateUrl,
    }: {
      onStickyCheckoutClick?: (ctx: {
        checkin: string;
        checkout: string;
        pax: number;
        href: string;
        proceed: () => void;
      }) => void;
      octorateUrl?: string;
    }) => {
      const proceed = jest.fn();
      capturedProceed = proceed;
      capturedOctorateUrl = octorateUrl;
      return (
        <button
          type="button"
          data-cy="sticky-book-now"
          onClick={() => {
            onStickyCheckoutClick?.({
              checkin: "2026-06-10",
              checkout: "2026-06-12",
              pax: 2,
              href: "https://book.octorate.com/octobook/site/reservation/calendar.xhtml",
              proceed,
            });
          }}
        >
          Book Now
        </button>
      );
    },
  };
});

const RoomDetailContent = require("@/app/[lang]/rooms/[id]/RoomDetailContent")
  .default as typeof import("@/app/[lang]/rooms/[id]/RoomDetailContent").default;

describe("TASK-35: RoomDetailContent sticky CTA begin_checkout GA4 contract", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    capturedProceed = null;
    capturedOctorateUrl = undefined;
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: Render does NOT fire begin_checkout (only view_item fires on mount)
  it("TC-01: render does not fire begin_checkout", async () => {
    render(<RoomDetailContent lang="en" id="room_10" />);

    await waitFor(() => {
      const viewItemCall = gtagMock.mock.calls.find(
        (args: unknown[]) => args[0] === "event" && args[1] === "view_item",
      );
      expect(viewItemCall).toBeTruthy();
    });

    const beginCheckoutCalls = gtagMock.mock.calls.filter(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutCalls).toHaveLength(0);
  });

  // TC-02: Clicking sticky CTA fires begin_checkout with correct room item fields
  it("TC-02: click sticky CTA fires begin_checkout with source + room item fields", () => {
    render(<RoomDetailContent lang="en" id="room_10" />);

    const btn = screen.getByTestId("sticky-book-now");
    fireEvent.click(btn);

    const beginCheckoutCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "begin_checkout",
    );
    expect(beginCheckoutCall).toBeTruthy();
    const payload = beginCheckoutCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({
      source: "sticky_cta",
      transport_type: "beacon",
    });
    const items = payload.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      item_id: "room_10",
      item_name: expect.any(String),
      item_category: "hostel",
      affiliation: "Hostel Brikette",
      currency: "EUR",
    });
  });

  // TC-03: trackThenNavigate calls proceed() after 200ms timeout fallback
  it("TC-03: navigation proceeds via timeout fallback after begin_checkout fires", () => {
    render(<RoomDetailContent lang="en" id="room_10" />);

    const btn = screen.getByTestId("sticky-book-now");
    fireEvent.click(btn);

    expect(capturedProceed).not.toBeNull();
    expect(capturedProceed).not.toHaveBeenCalled();

    jest.advanceTimersByTime(199);
    expect(capturedProceed).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(capturedProceed).toHaveBeenCalledTimes(1);
  });

  it("TC-WireUrl: passes a result.xhtml URL with room code to StickyBookNow for room_10", () => {
    capturedOctorateUrl = undefined;
    render(<RoomDetailContent lang="en" id="room_10" />);
    expect(capturedOctorateUrl).toContain("result.xhtml");
    expect(capturedOctorateUrl).toContain("room=433887");
  });
});
