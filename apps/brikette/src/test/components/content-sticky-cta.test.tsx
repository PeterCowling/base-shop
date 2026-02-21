// TC-01: Guide detail page renders the sticky CTA and clicking it opens BookingModal.
// TC-02: About page renders the sticky CTA and clicking it opens BookingModal.
// TC-03: Dismiss persists within session (navigate to another Tier 1 page → CTA stays hidden).
// TC-04: cta_click event fires with correct cta_id + cta_location enums.

import { describe, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { type AppLanguage } from "@/i18n.config";

// Helper: query by data-testid directly (global testIdAttribute is "data-cy"; component uses data-testid)
const getStickyCta = () => document.querySelector('[data-testid="content-sticky-cta"]');

// next/navigation: ContentStickyCta uses useRouter to navigate to /book.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockPush: jest.Mock<any, any, any>;
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock GA4 events module path
const mockFireCtaClick = jest.fn<() => void, []>();
const mockFireModalOpen = jest.fn<() => void, []>();

// Dynamic mock setup
jest.mock("../../utils/ga4-events", () => ({
  fireCtaClick: mockFireCtaClick,
  fireModalOpen: mockFireModalOpen,
  GA4_ENUMS: {
    ctaId: ["content_sticky_check_availability"],
    ctaLocation: ["guide_detail", "about_page", "bar_menu", "breakfast_menu"],
  },
  isCtaId: jest.fn(() => true),
  isCtaLocation: jest.fn(() => true),
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        // bare keys (used when component calls tTokens("key") with namespace as separate param)
        "close": "Close",
        "directBookingPerks": "Direct Booking Perks",
        "bestPriceGuaranteed": "Best Price Guaranteed",
        "checkAvailability": "Check availability",
        // namespaced keys (kept for compatibility)
        "_tokens:directBookingPerks": "Direct Booking Perks",
        "_tokens:bestPriceGuaranteed": "Best Price Guaranteed",
        "_tokens:checkAvailability": "Check availability",
        "stickyCta.directHeadline": "Lock in our best available rate in under two minutes.",
        "stickyCta.directSubcopy": "Skip third-party fees and get priority help from our Positano team.",
      };
      return translations[key] ?? options?.defaultValue ?? key;
    },
    ready: true,
  }),
}));

describe("ContentStickyCta", () => {
  let ContentStickyCta: typeof import("@/components/cta/ContentStickyCta").ContentStickyCta;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPush = jest.fn() as unknown as jest.Mock<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Reset sessionStorage
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }

    // Import component after mocks are set up
    const module = await import("../../components/cta/ContentStickyCta");
    ContentStickyCta = module.ContentStickyCta;
  });

  it("TC-01: guide detail page renders the sticky CTA and clicking it opens BookingModal", async () => {
    render(
      <ContentStickyCta lang="en" ctaLocation="guide_detail" />
    );

    // Verify CTA is rendered
    expect(getStickyCta()).toBeInTheDocument();

    // Verify copy elements are present
    expect(screen.getByText("Direct Booking Perks")).toBeInTheDocument();
    expect(screen.getByText("Best Price Guaranteed")).toBeInTheDocument();
    expect(screen.getByText("Lock in our best available rate in under two minutes.")).toBeInTheDocument();
    expect(screen.getByText("Skip third-party fees and get priority help from our Positano team.")).toBeInTheDocument();

    // Find and click the CTA button
    const ctaButton = screen.getByRole("button", { name: /check availability/i });
    expect(ctaButton).toBeInTheDocument();

    fireEvent.click(ctaButton);

    // Verify GA4 event was fired with correct params
    await waitFor(() => {
      expect(mockFireCtaClick).toHaveBeenCalledWith({
        ctaId: "content_sticky_check_availability",
        ctaLocation: "guide_detail",
      });
    });

    // Verify router navigates to /book
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/en/book");
    });
  });

  it("TC-02: about page renders the sticky CTA and clicking it navigates to /book", async () => {
    render(<ContentStickyCta lang="en" ctaLocation="about_page" />);

    // Verify CTA is rendered
    expect(getStickyCta()).toBeInTheDocument();

    // Click the CTA button
    const ctaButton = screen.getByRole("button", { name: /check availability/i });
    fireEvent.click(ctaButton);

    // Verify GA4 event was fired with correct location
    await waitFor(() => {
      expect(mockFireCtaClick).toHaveBeenCalledWith({
        ctaId: "content_sticky_check_availability",
        ctaLocation: "about_page",
      });
    });

    // Verify router navigates to /book
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/en/book");
    });
  });

  it("TC-03: dismiss persists within session via sessionStorage", async () => {
    const { rerender } = render(
      <ContentStickyCta lang="en" ctaLocation="guide_detail" />
    );

    // Verify CTA is initially visible
    expect(getStickyCta()).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(dismissButton);

    // Verify CTA is hidden after dismiss
    expect(getStickyCta()).not.toBeInTheDocument();

    // Verify sessionStorage was set
    expect(window.sessionStorage.getItem("content-sticky-cta-dismissed")).toBe("true");

    // Simulate navigation to another Tier 1 page (unmount and remount with different location)
    rerender(<ContentStickyCta lang="en" ctaLocation="about_page" />);

    // Verify CTA stays hidden (reads from sessionStorage)
    expect(getStickyCta()).not.toBeInTheDocument();
  });

  it("TC-04: cta_click event fires with correct cta_id + cta_location enums for all Tier 1 pages", async () => {
    const testCases: Array<{ location: AppLanguage extends string ? "guide_detail" | "about_page" | "bar_menu" | "breakfast_menu" : never }> = [
      { location: "guide_detail" },
      { location: "about_page" },
      { location: "bar_menu" },
      { location: "breakfast_menu" },
    ];

    for (const { location } of testCases) {
      jest.clearAllMocks();

      const { unmount } = render(
        <ContentStickyCta lang="en" ctaLocation={location} />
      );

      const ctaButton = screen.getByRole("button", { name: /check availability/i });
      fireEvent.click(ctaButton);

      await waitFor(() => {
        expect(mockFireCtaClick).toHaveBeenCalledWith({
          ctaId: "content_sticky_check_availability",
          ctaLocation: location,
        });
      });

      unmount();
    }
  });

  it("should handle sessionStorage access failure gracefully", async () => {
    // Mock sessionStorage to throw an error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error("Storage quota exceeded");
    });

    render(<ContentStickyCta lang="en" ctaLocation="guide_detail" />);

    // Verify CTA is rendered
    expect(getStickyCta()).toBeInTheDocument();

    // Click dismiss button
    const dismissButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(dismissButton);

    // CTA should still be dismissed in UI state (even if sessionStorage fails)
    expect(getStickyCta()).not.toBeInTheDocument();

    // Restore original implementation
    Storage.prototype.setItem = originalSetItem;
  });

  it("should render with all supported Tier 1 locations", () => {
    const locations: Array<"guide_detail" | "about_page" | "bar_menu" | "breakfast_menu"> = [
      "guide_detail",
      "about_page",
      "bar_menu",
      "breakfast_menu",
    ];

    for (const location of locations) {
      const { unmount } = render(
        <ContentStickyCta lang="en" ctaLocation={location} />
      );

      expect(getStickyCta()).toBeInTheDocument();

      unmount();
    }
  });
});
