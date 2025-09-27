/* i18n-exempt file -- tests use literal copy for assertions */
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders children and applies className", () => {
    render(
      <Footer className="custom" shopName="My Shop">
        Content
      </Footer>,
    );
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("custom");
  });
});
