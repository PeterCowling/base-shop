import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

jest.mock("@/hooks/usePagePreload", () => ({
  usePagePreload: jest.fn(),
}));

jest.mock("@/components/apartment/FitCheck", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/private-rooms/book",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, prefetch: _p, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock("@/utils/dateUtils", () => ({
  ...jest.requireActual("@/utils/dateUtils"),
  getTodayIso: () => "2026-03-01",
  getDatePlusTwoDays: () => "2026-03-03",
  safeParseIso: (iso: string) => {
    if (!iso) return undefined;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  },
}));

jest.mock("@/utils/ga4-events", () => ({
  ...jest.requireActual("@/utils/ga4-events"),
  createBrikClickId: () => "brik-click-id",
  fireWhatsappClick: jest.fn(),
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
import ApartmentBookContent from "@/app/[lang]/private-rooms/book/ApartmentBookContent";

describe("ApartmentBookContent Octorate URL matrix", () => {
  const mockAssign = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: mockAssign },
    });
  });

  function setPaxToThree(): void {
    fireEvent.click(screen.getByRole("button", { name: "Increase guests" }));
  }

  it.each([
    { plan: "nr", pax: 2, cta: "apartment.cta.nr", room: "804934", campaign: "apartment_nr_2pax" },
    { plan: "nr", pax: 3, cta: "apartment.cta.nr", room: "805559", campaign: "apartment_nr_3pax" },
    { plan: "flex", pax: 2, cta: "apartment.cta.flex", room: "804933", campaign: "apartment_flex_2pax" },
    { plan: "flex", pax: 3, cta: "apartment.cta.flex", room: "805578", campaign: "apartment_flex_3pax" },
  ])("routes $plan plan for $pax pax to correct room code", ({ pax, cta, room, campaign }) => {
    render(<ApartmentBookContent lang="en" />);

    if (pax === 3) {
      setPaxToThree();
    }

    fireEvent.click(screen.getByText(cta));

    expect(mockAssign).toHaveBeenCalledTimes(1);
    const target = String(mockAssign.mock.calls[0][0]);
    const url = new URL(target);

    expect(url.origin + url.pathname).toBe("https://book.octorate.com/octobook/site/reservation/calendar.xhtml");
    expect(url.searchParams.get("checkin")).toBe("2026-03-01");
    expect(url.searchParams.get("checkout")).toBe("2026-03-03");
    expect(url.searchParams.get("pax")).toBe(String(pax));
    expect(url.searchParams.get("room")).toBe(room);
    expect(url.searchParams.get("utm_campaign")).toBe(campaign);
  });
});
