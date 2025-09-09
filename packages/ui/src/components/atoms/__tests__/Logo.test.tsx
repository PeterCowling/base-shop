import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Logo } from "../Logo";

describe("Logo", () => {
  it("renders an image when src is provided", () => {
    render(<Logo src="/logo.png" shopName="Acme" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logo.png");
    expect(img).toHaveAttribute("alt", "Acme");
  });

  it("renders fallback text when src is undefined", () => {
    render(<Logo src={undefined} shopName="Shop" />);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
