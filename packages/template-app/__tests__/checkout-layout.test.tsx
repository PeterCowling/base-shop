/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

// Stub UI + i18n wrappers to keep the test lightweight
jest.mock("@ui/components/layout/Header", () => {
  function HeaderMock() {
    return <div data-cy="header" />;
  }
  return HeaderMock;
});
jest.mock("@ui/components/layout/Footer", () => {
  function FooterMock() {
    return <div data-cy="footer" />;
  }
  return FooterMock;
});
jest.mock("next-seo", () => {
  function DefaultSeo() {
    return <div data-cy="seo" />;
  }
  return { DefaultSeo };
});
jest.mock("@i18n/Translations", () => {
  function TranslationsMock({ children }: { children: React.ReactNode }) {
    return <div data-cy="i18n">{children}</div>;
  }
  return {
    __esModule: true,
    default: TranslationsMock,
  };
});
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
