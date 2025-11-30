import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import LocaleLayout from "../layout";

jest.mock("@ui/components/layout/Footer", () => ({
  __esModule: true,
  default: () => <div data-cy="footer" />,
}));

jest.mock("@ui/components/layout/Header", () => ({
  __esModule: true,
  default: jest.fn(({ lang }: { lang: string }) => (
    <div data-cy="header">{lang}</div>
  )),
}));

const HeaderMock =
  jest.requireMock("@ui/components/layout/Header").default as jest.Mock;

jest.mock("@i18n/Translations", () => ({
  __esModule: true,
  TranslationsProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

describe("LocaleLayout", () => {
  afterEach(() => HeaderMock.mockClear());

  it("renders with provided lang", async () => {
    const element = await LocaleLayout({
      children: <div />,
      params: Promise.resolve({ lang: "de" }),
    });
    render(element);
    // Uses the resolved locale when provided
    expect(screen.getByTestId("header")).toHaveTextContent("de");
  });

  it("defaults to 'en' when lang param is missing", async () => {
    const element = await LocaleLayout({
      children: <div />,
      params: Promise.resolve({}),
    });
    render(element);
    expect(screen.getByTestId("header")).toHaveTextContent("en");
  });
});
