import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@tests/renderers";

import { Footer } from "@/components/footer/Footer";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

const TEST_LANGUAGE = "en" as AppLanguage;
const EXPECTED_NAV_PATHS = [
  `/${TEST_LANGUAGE}/${getSlug("rooms", TEST_LANGUAGE)}`,
  `/${TEST_LANGUAGE}/${getSlug("experiences", TEST_LANGUAGE)}`,
  `/${TEST_LANGUAGE}/${getSlug("deals", TEST_LANGUAGE)}`,
  `/${TEST_LANGUAGE}/${getSlug("howToGetHere", TEST_LANGUAGE)}`,
  `/${TEST_LANGUAGE}/${getSlug("assistance", TEST_LANGUAGE)}`,
];

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("@/utils/translate-path", () => ({
  translatePath: (key: string) => (key === "home" ? "" : key),
}));

jest.mock("react-i18next", () => {
  const actual = jest.requireActual<typeof import("react-i18next")>("react-i18next");
  const dictionary: Record<string, string> = {
    terms: "Terms & Conditions",
    instagram: "Instagram",
    facebook: "Facebook",
    email: "Email",
    phone: "Phone",
    rooms: "Rooms",
    experiences: "Experiences",
    deals: "Deals",
    howToGetHere: "How to get here",
    assistance: "Help",
    backToTop: "Back to top",
    noPhoneNotice: "We do not conduct business by telephone. Please contact us via email.",
  };

  const i18nStub = {
    language: "en",
    changeLanguage: jest.fn(),
    options: { supportedLngs: ["en"] },
  } as const;

  return {
    ...actual,
    useTranslation: () => ({
      t: (...args: [string, unknown?]) => {
        const [key, second] = args;

        if (typeof second === "string") return second;

        if (
          second &&
          typeof second === "object" &&
          "defaultValue" in second &&
          typeof (second as { defaultValue: unknown }).defaultValue === "string"
        ) {
          return (second as { defaultValue: string }).defaultValue;
        }

        if (
          second &&
          typeof second === "object" &&
          "year" in second &&
          typeof (second as { year: unknown }).year === "number"
        ) {
          const { year } = second as { year: number };
          return `© 2023 to ${year}, Skylar SRL operating as Hostel Brikette`;
        }

        return dictionary[key] ?? key;
      },
      i18n: i18nStub,
    }),
    initReactI18next: actual.initReactI18next,
  };
});

describe("<Footer />", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders navigation links with correct hrefs", () => {
    renderWithProviders(<Footer />, { route: "/en" });

    const nav = screen.getByRole("navigation", { name: /footer navigation/i });
    const hrefs = within(nav).getAllByRole("link").map((link) => link.getAttribute("href") ?? "");

    for (const expectedHref of EXPECTED_NAV_PATHS) {
      expect(hrefs).toContain(expectedHref);
    }
  });

  it("renders Experiences and Help links in the footer navigation", () => {
    renderWithProviders(<Footer />, { route: "/en" });
    expect(screen.getByRole("link", { name: /experiences/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /help/i })).toBeInTheDocument();
  });

  it("renders legal links and copyright", () => {
    const year = new Date().getFullYear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(year + 5, 0, 1));
    renderWithProviders(<Footer />, { route: "/en" });

    const termsLinks = screen.getAllByRole("link", { name: /terms & conditions/i });
    expect(termsLinks.some((link) => link.getAttribute("href") === "/en/terms")).toBe(true);

    const regex = new RegExp(`© 2023 to ${year}.*hostel brikette`, "i");
    expect(screen.getByText(regex)).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("includes a back-to-top link", () => {
    renderWithProviders(<Footer />, { route: "/en" });

    const backToTop = screen.getByRole("link", { name: /back to top/i });
    expect(backToTop).toHaveAttribute("href", "#top");
  });

  it("displays contact details and social links", () => {
    renderWithProviders(<Footer />, { route: "/en" });

    expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:"),
    );
    expect(
      screen.getByText(/we do not conduct business by telephone\. please contact us via email\./i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /phone/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /facebook/i })).toBeInTheDocument();
  });

  it("has at least one visible nav landmark", () => {
    renderWithProviders(<Footer />, { route: "/en" });

    const navLinks = screen.getAllByRole("link");
    navLinks.forEach((link) => {
      expect(link).toBeVisible();
    });
  });

  it("uses semantic <footer> and <nav> structure", () => {
    renderWithProviders(<Footer />, { route: "/en" });

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: /footer navigation/i });
    expect(nav).toBeInTheDocument();

    const lists = within(nav).getAllByRole("list");
    const totalItems = lists.reduce((count, list) => count + within(list).getAllByRole("listitem").length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(EXPECTED_NAV_PATHS.length);
  });
});