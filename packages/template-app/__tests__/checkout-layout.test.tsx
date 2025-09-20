/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

// Stub UI + i18n wrappers to keep the test lightweight
jest.mock("@ui/components/layout/Header", () => () => <div data-cy="header" />);
jest.mock("@ui/components/layout/Footer", () => () => <div data-cy="footer" />);
jest.mock("next-seo", () => ({
  DefaultSeo: () => <div data-cy="seo" />,
}));
jest.mock("@i18n/Translations", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="i18n">{children}</div>
  ),
}));
jest.mock("../src/lib/seo", () => ({
  getSeo: async () => ({ title: "Test", additionalLinkTags: [] }),
}));

// Dynamic locale JSON import used by the layout
jest.mock("@i18n/en.json", () => ({ __esModule: true, default: { greet: "Hello" } }), { virtual: true });

describe("[lang]/checkout/layout", () => {
  it("wraps children with SEO, header, footer, and translations", async () => {
    const { default: Layout } = await import("../src/app/[lang]/checkout/layout");
    const ui = (await Layout({
      children: <div data-cy="child" />,
      params: Promise.resolve({ lang: ["en"] }),
    })) as ReactElement;
    render(ui);

    expect(screen.getByTestId("i18n")).toBeInTheDocument();
    expect(screen.getByTestId("seo")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
