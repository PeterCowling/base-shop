import { screen } from "@testing-library/react";
import NotFoundContent from "@/components/NotFoundContent";
import { renderWithProviders } from "./testUtils";

describe("NotFoundContent", () => {
  it("renders recovery links", () => {
    renderWithProviders(
      <NotFoundContent
        title="Page not found"
        body="Try another path."
        primaryCta="Back home"
        primaryHref="/en"
        secondaryCta="Shop"
        secondaryHref="/en/shop"
      />
    );

    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/en/shop");
  });
});
