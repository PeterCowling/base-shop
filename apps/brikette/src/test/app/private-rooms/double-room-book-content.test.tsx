import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

// --- Mocks ---

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("@/hooks/usePagePreload", () => ({
  usePagePreload: jest.fn(),
}));

jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/private-rooms/double-room/book",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, prefetch: _p, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock("@/utils/dateUtils", () => ({
  getTodayIso: jest.fn(() => "2026-03-01"),
  getDatePlusTwoDays: jest.fn(() => "2026-03-03"),
  formatDate: jest.fn((date: Date) => (date as Date).toISOString().slice(0, 10)),
  safeParseIso: jest.fn((iso: string) => {
    if (!iso) return undefined;
    const [y, m, d] = (iso as string).split("-").map(Number);
    return new Date(y, m - 1, d);
  }),
  countNights: jest.fn(() => 2),
}));

jest.mock("@/utils/ga4-events", () => ({
  createBrikClickId: () => "brik-click-id",
}));

jest.mock("@/utils/trackThenNavigate", () => ({
  trackThenNavigate: jest.fn((_event: string, _params: Record<string, unknown>, navigate: () => void) => {
    navigate();
  }),
}));

jest.mock("@/utils/entryAttribution", () => ({
  readAttribution: jest.fn(() => null),
}));

// eslint-disable-next-line import/first -- mocks must be declared before import under test
import DoubleRoomBookContent from "@/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent";

describe("DoubleRoomBookContent", () => {
  const mockAssign = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Restore default date mock implementations after clearAllMocks (clears call counts only).
    // Explicit reset is required for formatDate since TC-03 overrides it with mockReturnValue("").
    const dateUtils = require("@/utils/dateUtils") as {
      getTodayIso: jest.Mock;
      getDatePlusTwoDays: jest.Mock;
      formatDate: jest.Mock;
      safeParseIso: jest.Mock;
      countNights: jest.Mock;
    };
    dateUtils.getTodayIso.mockReturnValue("2026-03-01");
    dateUtils.getDatePlusTwoDays.mockReturnValue("2026-03-03");
    dateUtils.formatDate.mockImplementation((date: Date) => date.toISOString().slice(0, 10));
    dateUtils.safeParseIso.mockImplementation((iso: string) => {
      if (!iso) return undefined;
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(y, m - 1, d);
    });
    dateUtils.countNights.mockReturnValue(2);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: mockAssign },
    });
  });

  // TC-01: NR button calls trackThenNavigate with correct room_id, rate_plan, and pax
  it("TC-01: NR button click calls trackThenNavigate with room_id double_room, rate_plan nr, and pax 2", () => {
    const { trackThenNavigate } = require("@/utils/trackThenNavigate") as {
      trackThenNavigate: jest.Mock;
    };

    render(<DoubleRoomBookContent lang="en" />);
    fireEvent.click(screen.getByText("apartment.cta.nr"));

    expect(trackThenNavigate).toHaveBeenCalledWith(
      "handoff_to_engine",
      expect.objectContaining({
        room_id: "double_room",
        rate_plan: "nr",
        pax: 2,
        handoff_mode: "same_tab",
        engine_endpoint: "calendar",
      }),
      expect.any(Function),
    );
  });

  // TC-02: Flex button calls trackThenNavigate with rate_plan: "flex"
  it("TC-02: Flex button click calls trackThenNavigate with rate_plan flex", () => {
    const { trackThenNavigate } = require("@/utils/trackThenNavigate") as {
      trackThenNavigate: jest.Mock;
    };

    render(<DoubleRoomBookContent lang="en" />);
    fireEvent.click(screen.getByText("apartment.cta.flex"));

    expect(trackThenNavigate).toHaveBeenCalledWith(
      "handoff_to_engine",
      expect.objectContaining({
        room_id: "double_room",
        rate_plan: "flex",
        pax: 2,
      }),
      expect.any(Function),
    );
  });

  // TC-03: Checkout buttons disabled when date range is empty (both checkinIso and checkoutIso are "")
  it("TC-03: Checkout buttons are disabled when date range produces empty ISO strings", () => {
    const dateUtils = require("@/utils/dateUtils") as { formatDate: jest.Mock };
    dateUtils.formatDate.mockReturnValue("");

    render(<DoubleRoomBookContent lang="en" />);

    expect(screen.getByText("apartment.cta.nr").closest("button")).toBeDisabled();
    expect(screen.getByText("apartment.cta.flex").closest("button")).toBeDisabled();
  });

  // TC-04: NR button navigates to URL with room=433883 (NR rate code)
  it("TC-04: NR button click navigates to octorate URL with room=433883", () => {
    render(<DoubleRoomBookContent lang="en" />);
    fireEvent.click(screen.getByText("apartment.cta.nr"));

    expect(mockAssign).toHaveBeenCalledTimes(1);
    const url = new URL(String(mockAssign.mock.calls[0][0]));
    expect(url.searchParams.get("room")).toBe("433883");
    expect(url.origin + url.pathname).toBe("https://book.octorate.com/octobook/site/reservation/calendar.xhtml");
    expect(url.searchParams.get("checkin")).toBe("2026-03-01");
    expect(url.searchParams.get("checkout")).toBe("2026-03-03");
    expect(url.searchParams.get("pax")).toBe("2");
  });

  // TC-04b: Flex button navigates to URL with room=433894 (flex rate code)
  it("TC-04b: Flex button click navigates to octorate URL with room=433894", () => {
    render(<DoubleRoomBookContent lang="en" />);
    fireEvent.click(screen.getByText("apartment.cta.flex"));

    expect(mockAssign).toHaveBeenCalledTimes(1);
    const url = new URL(String(mockAssign.mock.calls[0][0]));
    expect(url.searchParams.get("room")).toBe("433894");
  });
});
