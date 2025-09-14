// apps/shop-bcd/src/components/NotFoundContent.test.tsx
import { render, screen } from "@testing-library/react";
import NotFoundContent from "./NotFoundContent";

describe("NotFoundContent", () => {
  it("renders headline, text, and homepage link", () => {
    render(<NotFoundContent />);
    expect(
      screen.getByRole("heading", { name: /page not found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The page you're looking for doesn't exist or has moved./i
      )
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /go to homepage/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
