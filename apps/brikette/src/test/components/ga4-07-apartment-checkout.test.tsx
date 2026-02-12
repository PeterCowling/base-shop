/**
 * GA4-07 TC-02/TC-04: Apartment begin_checkout enrichment
 *
 * Verifies that begin_checkout events include price, quantity (nights),
 * value, and currency parameters.
 */
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

jest.mock("@/components/apartment/FitCheck", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/utils/dateUtils", () => ({
  getTodayIso: () => "2026-03-01",
  getDatePlusTwoDays: () => "2026-03-04",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/apartment/book",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, prefetch: _p, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import ApartmentBookContent from "@/app/[lang]/apartment/book/ApartmentBookContent";

describe("ApartmentBookContent GA4 enrichment (GA4-07 TC-02/TC-04)", () => {
  let originalGtag: typeof window.gtag;
  const mockAssign = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: mockAssign },
    });
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-02: Apartment begin_checkout includes value, currency, price, quantity
  it("fires begin_checkout with price, quantity (nights), value, and currency", () => {
    render(<ApartmentBookContent lang="en" />);

    const ctaButton = screen.getByText("book.checkAvailability");
    fireEvent.click(ctaButton);

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        currency: "EUR",
        value: 450, // 3 nights * 150
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: "apartment",
            price: 150,
            quantity: 3,
          }),
        ]),
      }),
    );
  });

  // TC-04: Existing begin_checkout event still fires (regression)
  it("still fires begin_checkout with item_id and item_name (regression)", () => {
    render(<ApartmentBookContent lang="en" />);

    const ctaButton = screen.getByText("book.checkAvailability");
    fireEvent.click(ctaButton);

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        currency: "EUR",
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: "apartment",
            item_name: "apartment",
          }),
        ]),
      }),
    );
  });
});
