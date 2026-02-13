/**
 * GA4-07: 404 error tracking + e-commerce enrichment tests
 */
import { render } from "@testing-library/react";

// --- not-found mocks ---

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/nonexistent-page",
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/i18n.config", () => ({
  i18nConfig: { fallbackLng: "en" },
}));

// eslint-disable-next-line import/first -- mocks must be declared before the import under test
import GlobalNotFound from "@/app/not-found";

describe("GlobalNotFound GA4 tracking (GA4-07 TC-01)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    jest.clearAllMocks();
    originalGtag = window.gtag;
    window.gtag = jest.fn();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  // TC-01: 404 page → gtag("event", "page_not_found", { page_path }) fires
  it("fires page_not_found event with page_path before redirect", () => {
    render(<GlobalNotFound />);

    expect(window.gtag).toHaveBeenCalledWith("event", "page_not_found", {
      page_path: "/nonexistent-page",
    });
  });

  it("redirects to language-prefixed home", () => {
    render(<GlobalNotFound />);

    expect(mockReplace).toHaveBeenCalledWith("/en");
  });
});
