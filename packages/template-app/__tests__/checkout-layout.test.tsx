/** @jest-environment jsdom */
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

// Stub UI + i18n wrappers to keep the test lightweight
jest.mock("@acme/ui/components/layout/Header", () => {
  function HeaderMock() {
    return <div data-cy="header" />;
  }
  return HeaderMock;
});
jest.mock("@acme/ui/components/layout/Footer", () => {
  function FooterMock() {
    return <div data-cy="footer" />;
  }
  return FooterMock;
});
jest.mock("@acme/i18n/Translations", () => {
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
jest.mock("@acme/i18n/en.json", () => ({ __esModule: true, default: { greet: "Hello" } }), { virtual: true });

describe("[lang]/checkout/layout", () => {
  it("wraps children with header, footer, and translations", async () => {
    const { default: Layout } = await import("../src/app/[lang]/checkout/layout");
    const ui = (await Layout({
      children: <div data-cy="child" />,
      params: Promise.resolve({ lang: ["en"] }),
    })) as ReactElement;
    render(ui);

    expect(screen.getByTestId("i18n")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
