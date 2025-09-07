import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
  it("renders label and href", () => {
    render(<Button label="Click" href="/go" />);
    const link = screen.getByRole("link", { name: "Click" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/go");
  });
});
