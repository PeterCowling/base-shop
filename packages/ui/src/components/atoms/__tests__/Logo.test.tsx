import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { Logo } from "../Logo";

describe("Logo", () => {
  it("renders an image when src is provided", () => {
    render(<Logo src="/logo.png" alt="Logo" />);
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logo.png");
  });

  it("renders fallback text when src is undefined", () => {
    render(<Logo src={undefined} textFallback="Shop" />);
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
