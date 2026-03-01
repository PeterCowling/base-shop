// apps/brikette/src/test/components/room-detail-date-picker.test.tsx
// Tests for date picker in RoomDetailContent (TASK-DP validation contracts).
//
// These tests render RoomDetailContent and verify:
// - TC-DP-01: Default dates seeded (today + 2 nights, pax=1) when no URL params
// - TC-DP-02: Check-in change → router.replace called with new dates
// - TC-DP-03: Invalid dates (checkout ≤ checkin) → RoomCard receives queryState=invalid
// - TC-DP-04: Adults decrease button disabled at HOSTEL_MIN_PAX

import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — all must be declared before component import
// ---------------------------------------------------------------------------

jest.mock("@acme/ui/context/ModalContext", () => {
  const React = require("react");
  const ModalContext = React.createContext(null);
  return {
    __esModule: true,
    ModalContext,
    ssrStub: { activeModal: null, modalData: null, openModal: () => {}, closeModal: () => {} },
    useModal: () => {
      const ctx = React.useContext(ModalContext);
      if (!ctx) throw new Error("Missing ModalContext Provider in test");
      return ctx;
    },
  };
});

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; returnObjects?: boolean }) => {
      if (opts?.returnObjects) return {};
      return opts?.defaultValue ?? key;
    },
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k, getResource: () => null },
    ready: true,
  }),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => "/en/rooms/room_10",
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams = new URLSearchParams();

jest.mock("next/link", () => {
  function MockLink({ children, href, prefetch: _prefetch, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean }) {
    return <a href={href} {...props}>{children}</a>;
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Stub heavy UI organisms
jest.mock("@acme/ui/organisms/StickyBookNow", () => ({ __esModule: true, default: () => null }));

// Mock RoomCard to capture props (avoids heavy UI rendering)
const capturedRoomCardProps: Array<Record<string, unknown>> = [];
jest.mock("@/components/rooms/RoomCard", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedRoomCardProps.push({ ...props });
    return <div data-cy="room-card" data-query-state={String(props.queryState)} />;
  },
}));

// Stub usePagePreload (no-op in tests)
jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));

// useAvailabilityForRoom: return empty state (feature flag off in tests)
jest.mock("@/hooks/useAvailabilityForRoom", () => ({
  useAvailabilityForRoom: () => ({ availabilityRoom: undefined, loading: false, error: null }),
}));

// Stub other components that cause import errors in test environment
jest.mock("@/components/booking/LocationInline", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/SocialProofSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/rooms/FacilityIcon", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/seo/RoomStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/molecules", () => ({
  DirectBookingPerks: () => null,
  RoomCard: () => null,
}));

// ---------------------------------------------------------------------------
// Import component after mocks
// ---------------------------------------------------------------------------

const { ModalContext } = require("@acme/ui/context/ModalContext");
const RoomDetailContent = require("@/app/[lang]/dorms/[id]/RoomDetailContent").default as typeof import("@/app/[lang]/dorms/[id]/RoomDetailContent").default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRoomDetail(searchParams?: URLSearchParams) {
  mockSearchParams = searchParams ?? new URLSearchParams();
  capturedRoomCardProps.length = 0;

  return render(
    <ModalContext.Provider value={{ activeModal: null, modalData: null, openModal: jest.fn(), closeModal: jest.fn() }}>
      <RoomDetailContent lang="en" id="room_10" />
    </ModalContext.Provider>
  );
}

/** Get today's date as YYYY-MM-DD without importing from app code */
function getTodayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add 2 days to a YYYY-MM-DD date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoomDetailContent — date picker (TASK-DP)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-DP-01: Page load with no URL params → default dates seeded, router.replace called
  it("TC-DP-01: no URL params → router.replace seeded with today + 2 nights, pax=1", async () => {
    renderRoomDetail();

    const todayIso = getTodayIso();
    const checkoutIso = addDays(todayIso, 2);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining(`checkin=${todayIso}`),
        expect.objectContaining({ scroll: false })
      );
    }, { timeout: 2000 });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining(`checkout=${checkoutIso}`),
      expect.any(Object)
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("pax=1"),
      expect.any(Object)
    );
  });

  // TC-DP-02: Date range change → router.replace called with new checkin/checkout params
  it("TC-DP-02: range change → router.replace with new checkin param", async () => {
    const todayIso = getTodayIso();
    // Provide existing params so no default seed fires
    renderRoomDetail(new URLSearchParams(`checkin=${todayIso}&checkout=${addDays(todayIso, 2)}&pax=1`));

    fireEvent.change(screen.getByLabelText(/check in/i), {
      target: { value: "2025-06-15" },
    });
    fireEvent.change(screen.getByLabelText(/check out/i), {
      target: { value: "2025-06-17" },
    });

    await waitFor(() => {
      const replaceCalls = mockReplace.mock.calls;
      const hasNewCheckin = replaceCalls.some(
        (args) => typeof args[0] === "string" && args[0].includes("checkin=2025-06-15")
      );
      expect(hasNewCheckin).toBe(true);
    }, { timeout: 1000 });
  });

  // TC-DP-03: URL params with invalid stay (checkin === checkout) → RoomCard gets queryState=invalid
  it("TC-DP-03: invalid stay (checkout = checkin) → RoomCard receives queryState=invalid", () => {
    const todayIso = getTodayIso();
    // checkin=checkout → 0 nights, fails isValidStayRange
    renderRoomDetail(new URLSearchParams(`checkin=${todayIso}&checkout=${todayIso}&pax=1`));

    // The last captured RoomCard props should have queryState="invalid"
    expect(capturedRoomCardProps.length).toBeGreaterThan(0);
    const lastProps = capturedRoomCardProps[capturedRoomCardProps.length - 1];
    expect(lastProps.queryState).toBe("invalid");
  });

  // TC-DP-04: Adults decrement button disabled at minimum (1 adult = HOSTEL_MIN_PAX)
  it("TC-DP-04: decrease-adults button disabled at minimum pax", () => {
    const todayIso = getTodayIso();
    renderRoomDetail(new URLSearchParams(`checkin=${todayIso}&checkout=${addDays(todayIso, 2)}&pax=1`));

    const decreaseButton = screen.getByRole("button", { name: /decrease adults/i });
    expect(decreaseButton).toBeDisabled();
  });
});
