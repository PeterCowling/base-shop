import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/en/deals",
}));

jest.mock("@/hooks/usePagePreload", () => ({ usePagePreload: () => {} }));
jest.mock("@/context/ModalContext", () => ({
  __esModule: true,
  useOptionalModal: () => ({ openModal: jest.fn(), closeModal: jest.fn(), activeModal: null, modalData: null }),
}));
jest.mock("@/components/seo/DealsStructuredData", () => ({ __esModule: true, default: () => null }));
// Mock i18n module to avoid import.meta issues
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { getResource: () => "" },
}));
// Mock DealCard to expose a simple clickable button per deal without Next.js Link complexity
// Note: project uses data-cy as testIdAttribute (jest.setup.ts configure({ testIdAttribute: "data-cy" }))
jest.mock("@/routes/deals/DealCard", () => ({
  __esModule: true,
  default: ({ deal, onOpenBooking }: { deal: { id: string }; onOpenBooking: (args: { kind: "deal"; dealId: string }) => void }) => (
    <button
      type="button"
      data-cy={`deal-cta-${deal.id}`}
      onClick={() => onOpenBooking({ kind: "deal", dealId: deal.id })}
    >
      {`Book Direct ${deal.id}`}
    </button>
  ),
}));

const DealsPageContent = require("@/app/[lang]/deals/DealsPageContent")
  .default as typeof import("@/app/[lang]/deals/DealsPageContent").default;

describe("TASK-34: DealsPageContent view_promotion + select_promotion GA4 contract", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set time to when sep20_oct31_15off is active (Sept 20 – Oct 31, 2025)
    jest.setSystemTime(new Date("2025-10-01T12:00:00Z"));
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
    jest.useRealTimers();
  });

  // TC-01: Render fires view_promotion with all deals in promotions array
  it("TC-01: render fires view_promotion with promotions array for all deals", () => {
    render(<DealsPageContent lang="en" />);

    const viewPromoCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "view_promotion",
    );
    expect(viewPromoCall).toBeTruthy();
    const payload = viewPromoCall?.[2] as Record<string, unknown>;
    const promotions = payload.promotions as Array<Record<string, unknown>>;
    expect(promotions).toHaveLength(1); // DEALS has one entry
    expect(promotions[0]).toMatchObject({
      promotion_id: "sep20_oct31_15off",
      promotion_name: "15% off",
    });
  });

  // TC-02: Clicking Book Direct fires select_promotion then navigates to /book?deal=ID
  it("TC-02: click Book Direct fires select_promotion with correct promotion + navigates to /book", () => {
    render(<DealsPageContent lang="en" />);

    const btn = screen.getByTestId("deal-cta-sep20_oct31_15off");
    fireEvent.click(btn);

    const selectPromoCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "select_promotion",
    );
    expect(selectPromoCall).toBeTruthy();
    const payload = selectPromoCall?.[2] as Record<string, unknown>;
    const promotions = payload.promotions as Array<Record<string, unknown>>;
    expect(promotions).toHaveLength(1);
    expect(promotions[0]).toMatchObject({
      promotion_id: "sep20_oct31_15off",
      promotion_name: "15% off",
    });

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/book?deal=sep20_oct31_15off");
  });
});
