/**
 * TASK-09: TC-01 and TC-02 integration tests.
 *
 * TC-01: BookingWidget → booking modal payload integration
 * TC-02: PolicyFeeClarityPanel namespace race (graceful empty + items rendered)
 *
 * TC-04 (tab-trap) is added to packages/ui ModalBasics.test.tsx.
 * TC-05 (handoff events + deduplication) is covered by ga4-09 and ga4-10.
 * TC-03 / TC-06 fall to staging manual QA checklist (no Playwright harness).
 */

import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — must be declared before any import of the modules under test.
// ---------------------------------------------------------------------------

// @acme/ui/context/ModalContext and @/context/ModalContext are both mapped by
// jest.config.cjs to src/test/__mocks__/ui-modal-context.tsx. That mock now
// uses useContext so wrapping in ModalContext.Provider works in TC-01 tests.
// No jest.mock factory needed here — the module mapper handles it.

// react-i18next: return translation key as the translation value by default.
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  })),
}));

// @acme/design-system/atoms and @acme/design-system/primitives both resolve to the
// same stub file via jest.config.cjs moduleNameMapper. A second jest.mock() factory
// for the same resolved path would overwrite the first, leaving Section undefined.
// Combine both exports in a single mock to avoid this collision.
jest.mock("@acme/design-system/atoms", () => ({
  Section: ({ children, as: _as, padding: _padding, ...rest }: any) =>
    React.createElement("div", rest, children),
  Button: ({ children, onClick, type, color: _color, tone: _tone, size: _size, ...rest }: any) =>
    React.createElement("button", { onClick, type, ...rest }, children),
}));
// Note: do NOT add a separate jest.mock for @acme/design-system/primitives —
// both paths resolve to the same stub file and a second factory would overwrite this one.

// @acme/ui/shared: CTA label — just invoke the fallback.
jest.mock("@acme/ui/shared", () => ({
  resolvePrimaryCtaLabel: (_t: unknown, { fallback }: { fallback: () => string }) => fallback(),
}));

// @acme/ui/utils/bookingDateFormat: stable ISO format for test inputs.
jest.mock("@acme/ui/utils/bookingDateFormat", () => ({
  resolveBookingDateFormat: () => ({ dateFormat: "YYYY-MM-DD", placeholder: "YYYY-MM-DD", inputLocale: "en" }),
}));

// GA4 events: silence fireCtaClick.
jest.mock("@/utils/ga4-events", () => ({
  fireCtaClick: jest.fn(),
}));

// next/link: anchor passthrough — strip next-specific props to avoid React 19
// console.error for unknown DOM attributes (prefetch, scroll, replace, etc.).
jest.mock("next/link", () => {
  const LinkMock = React.forwardRef(function LinkPassthrough(
    { children, href, prefetch: _p, scroll: _s, replace: _r, ...rest }: any,
    ref: any,
  ) {
    return React.createElement("a", { href, ref, ...rest }, children);
  });
  return { __esModule: true, default: LinkMock };
});

// @/utils/slug: stub terms slug.
jest.mock("@/utils/slug", () => ({
  getSlug: () => "terms",
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
 
// eslint-disable-next-line import/first
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
// eslint-disable-next-line import/first
import BookingWidget from "@/components/landing/BookingWidget";
// eslint-disable-next-line import/first
import { ModalContext } from "@/context/modal/context";

// ---------------------------------------------------------------------------
// Helper to get the useTranslation mock for per-test overrides (TC-02).
// ---------------------------------------------------------------------------
function getUseTranslationMock(): jest.Mock {
  return (jest.requireMock("react-i18next") as { useTranslation: jest.Mock }).useTranslation;
}

// ---------------------------------------------------------------------------
// TC-01: BookingWidget → booking modal payload integration
// ---------------------------------------------------------------------------
describe("TC-01: BookingWidget → booking modal payload integration (TASK-09)", () => {
  beforeEach(() => {
    // BookingWidget writes date state back to window.location.search via useEffect.
    // Clear URL search params between tests to prevent cross-test contamination.
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("calls openModal('booking') with the entered checkIn, checkOut, and adults", () => {
    const mockOpenModal = jest.fn();
    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal: mockOpenModal,
          closeModal: jest.fn(),
        }}
      >
        <BookingWidget />
      </ModalContext.Provider>,
    );

    const checkInInput = screen.getByLabelText("booking.checkInLabel");
    const checkOutInput = screen.getByLabelText("booking.checkOutLabel");
    const guestsInput = screen.getByLabelText("booking.guestsLabel");

    // Use ISO format — BookingWidget's parseDateInput handles YYYY-MM-DD.
    fireEvent.change(checkInInput, { target: { value: "2025-06-01" } });
    fireEvent.change(checkOutInput, { target: { value: "2025-06-03" } });
    fireEvent.change(guestsInput, { target: { value: "2" } });

    // Only one button in the widget (the CTA).
    fireEvent.click(screen.getByRole("button"));

    expect(mockOpenModal).toHaveBeenCalledTimes(1);
    expect(mockOpenModal).toHaveBeenCalledWith("booking", {
      checkIn: "2025-06-01",
      checkOut: "2025-06-03",
      adults: 2,
    });
  });

  it("calls openModal('booking') with undefined dates when fields are empty", () => {
    const mockOpenModal = jest.fn();
    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal: mockOpenModal,
          closeModal: jest.fn(),
        }}
      >
        <BookingWidget />
      </ModalContext.Provider>,
    );

    // Click without filling any dates — empty string || undefined = undefined.
    fireEvent.click(screen.getByRole("button"));

    expect(mockOpenModal).toHaveBeenCalledWith("booking", {
      checkIn: undefined,
      checkOut: undefined,
      adults: 1,
    });
  });

  it("does not call openModal when date range is invalid (checkout <= checkin)", () => {
    const mockOpenModal = jest.fn();
    render(
      <ModalContext.Provider
        value={{
          activeModal: null,
          modalData: null,
          openModal: mockOpenModal,
          closeModal: jest.fn(),
        }}
      >
        <BookingWidget />
      </ModalContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText("booking.checkInLabel"), {
      target: { value: "2025-06-05" },
    });
    fireEvent.change(screen.getByLabelText("booking.checkOutLabel"), {
      target: { value: "2025-06-03" }, // Before check-in — invalid range
    });

    fireEvent.click(screen.getByRole("button"));

    // Widget shows error and does NOT open modal on invalid range.
    expect(mockOpenModal).not.toHaveBeenCalled();
    // Error alert is shown.
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-02: PolicyFeeClarityPanel — namespace race (empty then loaded)
// ---------------------------------------------------------------------------
describe("TC-02: PolicyFeeClarityPanel namespace race (TASK-09)", () => {
  afterEach(() => {
    // Restore default mock after each TC-02 test to avoid leaking into later tests.
    getUseTranslationMock().mockImplementation(() => ({
      t: (key: string) => key,
      i18n: { language: "en" },
    }));
  });

  it("renders without crashing and shows no items when bookPage namespace is empty", () => {
    // Simulate unloaded namespace: items returns empty array.
    getUseTranslationMock().mockImplementation(() => ({
      t: (key: string, opts?: { returnObjects?: boolean }) => {
        if (opts?.returnObjects) return [];
        return key;
      },
      i18n: { language: "en" },
    }));

    render(<PolicyFeeClarityPanel lang="en" variant="hostel" />);

    // Panel renders gracefully — no list items, but heading is present.
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("renders all hostel policy items once bookPage namespace resolves", () => {
    const mockItems = ["Tourist tax", "Keycard deposit", "Security hold", "Cancellation fee", "Reception hours"];
    getUseTranslationMock().mockImplementation(() => ({
      t: (key: string, opts?: { returnObjects?: boolean }) => {
        if (opts?.returnObjects) return mockItems;
        return key;
      },
      i18n: { language: "en" },
    }));

    render(<PolicyFeeClarityPanel lang="en" variant="hostel" />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(screen.getByText("Tourist tax")).toBeInTheDocument();
    expect(screen.getByText("Keycard deposit")).toBeInTheDocument();
    expect(screen.getByText("Reception hours")).toBeInTheDocument();
  });

  it("filters to hostel-excluded items for apartment variant", () => {
    // 5 items: idx 0=Tourist tax, 1=Keycard deposit, 2=Security hold, 3=Cancel fee, 4=Reception hours
    const mockItems = ["Tourist tax", "Keycard deposit", "Security hold", "Cancellation fee", "Reception hours"];
    getUseTranslationMock().mockImplementation(() => ({
      t: (key: string, opts?: { returnObjects?: boolean }) => {
        if (opts?.returnObjects) return mockItems;
        return key;
      },
      i18n: { language: "en" },
    }));

    render(<PolicyFeeClarityPanel lang="en" variant="apartment" />);

    // Apartment keeps idx 0, 2, 3 only.
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByText("Tourist tax")).toBeInTheDocument();
    expect(screen.getByText("Security hold")).toBeInTheDocument();
    expect(screen.getByText("Cancellation fee")).toBeInTheDocument();
    // Hostel-only items should not appear.
    expect(screen.queryByText("Keycard deposit")).not.toBeInTheDocument();
    expect(screen.queryByText("Reception hours")).not.toBeInTheDocument();
  });
});
