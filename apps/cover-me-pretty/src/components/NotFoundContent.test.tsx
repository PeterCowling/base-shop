// apps/cover-me-pretty/src/components/NotFoundContent.test.tsx
import { render, screen } from "@testing-library/react";
import NotFoundContent from "./NotFoundContent";
import TranslationsProvider from "@i18n/Translations";
import en from "@i18n/en.json";

describe("NotFoundContent", () => {
  it("renders headline, text, and homepage link", () => {
    render(
      <TranslationsProvider messages={en}>
        <NotFoundContent />
      </TranslationsProvider>
    );
    expect(
      screen.getByRole("heading", { name: /page not found/i })
    ).toBeInTheDocument();
    expect(screen.getByText(en["notFound.desc"]))
      .toBeInTheDocument();
    const link = screen.getByRole("link", { name: en["nav.home"] });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
