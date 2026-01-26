import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import DealsBanner from "@/components/deals/DealsBanner";
import enDeals from "@/locales/en/dealsPage.json";

const translationMocks: Record<string, (key: string, opts?: { beds: number; time: string }) => string> = {};

jest.mock("react-i18next", () => ({
  useTranslation: (_namespace?: string, opts?: { lng?: string }) => {
    const lang = opts?.lng ?? "en";
    return {
      t: (key: string, params?: { beds: number; time: string }) =>
        translationMocks[lang]?.(key, params) ?? key,
    };
  },
}));

jest.mock("@/context/NotificationBannerContext", () => ({
  useSetBannerRef: () => jest.fn(),
}));

describe("<DealsBanner />", () => {
  beforeEach(() => {
    Object.keys(translationMocks).forEach((key) => {
      delete translationMocks[key];
    });
  });

  it("renders locale-specific banner copy when available", () => {
    translationMocks.en = (_key, opts) =>
      `Only ${opts?.beds} beds left - deal ends in ${opts?.time}!`;
    translationMocks.it = (_key, opts) =>
      `Solo ${opts?.beds} beds left - ends in ${opts?.time}!`;

    render(<DealsBanner beds={6} time="2d" lang="it" />);

    expect(screen.getByText("Solo 6 beds left - ends in 2d!")).toBeInTheDocument();
  });

  it("falls back to the English string when the locale returns the key", () => {
    translationMocks.en = (_key, opts) =>
      `Only ${opts?.beds} beds left - deal ends in ${opts?.time}!`;
    translationMocks.es = (key) => key;

    render(<DealsBanner beds={4} time="12h" lang="es" />);

    expect(screen.getByText("Only 4 beds left - deal ends in 12h!")).toBeInTheDocument();
  });

  it("uses the template when translations echo placeholders", () => {
    translationMocks.en = () => "Only {{beds}} beds left - deal ends in {{time}}!";
    translationMocks.fr = () => "Only {{beds}} beds left - deal ends in {{time}}!";

    render(<DealsBanner beds={2} time="tonight" lang="fr" />);

    expect(
      screen.getByText("Only 2 beds left at this rate - deal ends in tonight!"),
    ).toBeInTheDocument();
  });

  it("falls back to the English template when translations are empty", () => {
    translationMocks.en = () => "";
    translationMocks.de = () => "";

    render(<DealsBanner beds={1} time="soon" lang="de" />);

    expect(
      screen.getByText("Only 1 beds left at this rate - deal ends in soon!"),
    ).toBeInTheDocument();
  });

  it("removes undefined placeholder values when falling back to the template", () => {
    translationMocks.en = () => "Only {{beds}} beds left at this rate - deal ends in {{time}}!";
    translationMocks.fr = () => "";

    render(<DealsBanner beds={null as unknown as number} time="tomorrow" lang="fr" />);

    expect(
      screen.getByText("Only beds left at this rate - deal ends in tomorrow!"),
    ).toBeInTheDocument();
  });

  it("returns the key when the fallback template resolves to an empty string", () => {
    const originalBanner = enDeals.banner;
    (enDeals as unknown as { banner: string }).banner = "";
    translationMocks.en = () => "";
    translationMocks.de = (key) => key;

    render(<DealsBanner beds={3} time="later" lang="de" />);

    expect(screen.getByText("banner")).toBeInTheDocument();

    (enDeals as unknown as { banner: string }).banner = originalBanner;
  });
});