import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

// Custom ModalContext mock using require("react") to avoid hoisting issues — same pattern as ga4-view-item-detail.test.tsx
jest.mock("@acme/ui/context/ModalContext", () => {
  const React = require("react");
  const ModalContext = React.createContext(null);
  return {
    __esModule: true,
    ModalContext,
    ssrStub: { activeModal: null, modalData: null, openModal: () => {}, closeModal: () => {} },
    useModal: () => {
      const ctx = React.useContext(ModalContext);
      if (!ctx) throw new Error("Missing ModalContext.Provider in test");
      return ctx;
    },
    useOptionalModal: () => {
      const ctx = React.useContext(ModalContext);
      return ctx ?? { activeModal: null, modalData: null, openModal: () => {}, closeModal: () => {} };
    },
  };
});

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
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useCurrentLanguage", () => ({ useCurrentLanguage: () => "en" }));

// Mock lazy-modals OffersModal to render a simple "Reserve Now" button
jest.mock("../../context/modal/lazy-modals", () => ({
  OffersModal: ({ onReserve }: { onReserve: () => void }) => (
    <button type="button" data-cy="offers-reserve-btn" onClick={onReserve}>
      Reserve Now
    </button>
  ),
}));

jest.mock("@acme/ui/shared", () => ({
  resolveBookingCtaLabel: (_tTokens: unknown, opts: { fallback: () => string }) => opts.fallback(),
}));

const { ModalContext } = require("@acme/ui/context/ModalContext") as { ModalContext: React.Context<unknown> };
const { OffersGlobalModal } = require("@/context/modal/global-modals/OffersModal") as typeof import("@/context/modal/global-modals/OffersModal");

const mockCloseModal = jest.fn();
const mockModalContextValue = {
  activeModal: "offers" as const,
  modalData: null,
  openModal: jest.fn(),
  closeModal: mockCloseModal,
};

function renderWithModalContext() {
  return render(
    <ModalContext.Provider value={mockModalContextValue}>
      <OffersGlobalModal />
    </ModalContext.Provider>,
  );
}

describe("TASK-36: OffersGlobalModal cta_click GA4 contract", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-01: "Reserve Now" click fires cta_click with correct ctaId + ctaLocation
  it("TC-01: Reserve Now fires cta_click with offers_modal_reserve + offers_modal", () => {
    renderWithModalContext();

    const btn = screen.getByTestId("offers-reserve-btn");
    fireEvent.click(btn);

    const ctaClickCall = gtagMock.mock.calls.find(
      (args: unknown[]) => args[0] === "event" && args[1] === "cta_click",
    );
    expect(ctaClickCall).toBeTruthy();
    const payload = ctaClickCall?.[2] as Record<string, unknown>;
    expect(payload).toMatchObject({
      cta_id: "offers_modal_reserve",
      cta_location: "offers_modal",
    });
  });

  // TC-02: Navigation to /book still occurs after cta_click fires
  it("TC-02: navigation to /book occurs after cta_click", () => {
    renderWithModalContext();

    const btn = screen.getByTestId("offers-reserve-btn");
    fireEvent.click(btn);

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/en/book");
    expect(mockCloseModal).toHaveBeenCalledTimes(1);
  });
});
