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
  safeParseIso: (iso: string) => {
    if (!iso) return undefined;
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  },
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

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import ApartmentBookContent from "@/app/[lang]/private-rooms/book/ApartmentBookContent";

jest.mock("@/components/booking/PolicyFeeClarityPanel", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/utils/ga4-events", () => ({
  ...jest.requireActual("@/utils/ga4-events"),
  fireWhatsappClick: jest.fn(),
}));

// --- GA4-07 TC-02/TC-04 (pre-existing) ---

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

    const ctaButton = screen.getByText("apartment.cta.flex");
    fireEvent.click(ctaButton);

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({
        currency: "EUR",
        value: 795, // 3 nights * 265
        items: expect.arrayContaining([
          expect.objectContaining({
            item_id: "apartment",
            price: 265,
            quantity: 3,
          }),
        ]),
      }),
    );
  });

  // TC-04: Existing begin_checkout event still fires (regression)
  it("still fires begin_checkout with item_id and item_name (regression)", () => {
    render(<ApartmentBookContent lang="en" />);

    const ctaButton = screen.getByText("apartment.cta.flex");
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

// Note: global testIdAttribute is "data-cy"; component uses data-testid.
// Query by data-testid directly (same pattern as content-sticky-cta.test.tsx line 11).
const getWhatsappCta = () => document.querySelector('[data-testid="whatsapp-cta"]');

// --- TASK-09: WhatsApp prefill, long-stay reroute, sessionStorage redirect-back ---

describe("TASK-09: WhatsApp prefill, long-stay reroute, and sessionStorage redirect-back UX", () => {
   
  const { fireWhatsappClick } = require("@/utils/ga4-events") as {
    fireWhatsappClick: jest.Mock;
  };

  const callOrder: string[] = [];
  let setItemSpy: jest.SpyInstance;
  const mockNavigate = jest.fn(() => {
    callOrder.push("assign");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
    window.gtag = jest.fn();
    setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation((key: string) => {
      if (key === "apartment_booking_return") {
        callOrder.push("setItem");
      }
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: mockNavigate },
    });
  });

  afterEach(() => {
    setItemSpy.mockRestore();
    sessionStorage.clear();
  });

  // TC-01: WhatsApp href includes URL-encoded dates
  it("TC-01: WhatsApp CTA href is prefilled with URL-encoded checkin and checkout dates", () => {
    render(<ApartmentBookContent lang="en" />);

    const link = getWhatsappCta();
    expect(link).not.toBeNull();
    const href = link!.getAttribute("href") ?? "";

    expect(href).toContain("wa.me/393287073695");
    // Dates appear encoded in the query string
    expect(href).toContain("2026-03-01");
    expect(href).toContain("2026-03-04");
  });

  // TC-02: whatsapp_click GA4 event fires on click with placement and prefill_present
  it("TC-02: clicking WhatsApp CTA fires whatsapp_click event with placement and prefill_present:true", () => {
    render(<ApartmentBookContent lang="en" />);

    const link = getWhatsappCta();
    expect(link).not.toBeNull();
    fireEvent.click(link!);

    expect(fireWhatsappClick).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: expect.any(String),
        prefill_present: true,
      }),
    );
  });

  // TC-03: Long-stay (>14 nights) exposes data-long-stay-primary attribute
  it("TC-03: checkout >14 nights after checkin sets data-long-stay-primary='true' on WhatsApp CTA", () => {
    render(<ApartmentBookContent lang="en" />);

    // Set checkout to 19 nights after the mocked checkin (2026-03-01)
    fireEvent.change(screen.getByLabelText("booking2.checkOutDate"), {
      target: { value: "2026-03-20" },
    });

    const link = getWhatsappCta();
    expect(link).not.toBeNull();
    expect(link!.getAttribute("data-long-stay-primary")).toBe("true");
  });

  // TC-04: Source contains no disallowed pricing claims (policy: pricing-claim-policy.md)
  it("TC-04: ApartmentBookContent source has no disallowed pricing claims", () => {
     
    const fs = require("fs") as typeof import("fs");
     
    const nodePath = require("path") as typeof import("path");
    const src = fs.readFileSync(
      nodePath.resolve(__dirname, "../../app/[lang]/private-rooms/book/ApartmentBookContent.tsx"),
      "utf8",
    );
    // Per pricing-claim-policy.md — these phrases must never appear in source
    expect(src).not.toMatch(/€265 guaranteed/);
    expect(src).not.toMatch(/Always from €265/);
    expect(src).not.toMatch(/"€265\/night"/);
  });

  // TC-05: sessionStorage stores booking return state before navigation
  it("TC-05: sessionStorage stores checkin/checkout before window.location.assign", () => {
    render(<ApartmentBookContent lang="en" />);

    fireEvent.click(screen.getByText("apartment.cta.flex"));

    const storedCall = setItemSpy.mock.calls.find(([key]) => key === "apartment_booking_return");
    expect(storedCall).toBeDefined();
    const stored = JSON.parse((storedCall as [string, string])[1]) as {
      checkin: string;
      checkout: string;
    };
    expect(stored.checkin).toBe("2026-03-01");
    expect(stored.checkout).toBe("2026-03-04");

    // sessionStorage must be called before navigation
    expect(callOrder).toEqual(["setItem", "assign"]);
  });
});
