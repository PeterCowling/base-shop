import { render, screen } from "@testing-library/react";

import Button from "../Button";

const sizeClasses = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
} as const;

describe("Button", () => {
  it("renders label and href", () => {
    render(<Button label="Click" href="/go" />);
    const link = screen.getByRole("link", { name: "Click" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/go");
  });

  Object.entries(sizeClasses).forEach(([size, classes]) => {
    it(`applies ${size} size classes`, () => {
      render(
        <Button label="Click" href="/go" size={size as keyof typeof sizeClasses} />,
      );
      const link = screen.getByRole("link", { name: "Click" });
      classes.split(" ").forEach((cls) => expect(link).toHaveClass(cls));
    });
  });

  it("supports non-default variant", () => {
    render(<Button label="Click" href="/go" variant="outline" />);
    const link = screen.getByRole("link", { name: "Click" });
    expect(link).toHaveAttribute("data-token", "--color-accent");
  });
});
