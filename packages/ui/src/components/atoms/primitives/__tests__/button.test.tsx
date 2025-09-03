import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Button, type ButtonProps } from "../button";

describe("Button", () => {
  const cases: Array<{ variant: NonNullable<ButtonProps["variant"]>; className: string; token: string }> = [
    { variant: "default", className: "bg-primary", token: "--color-primary" },
    { variant: "outline", className: "border-input", token: "--color-accent" },
    { variant: "ghost", className: "hover:bg-accent", token: "--color-accent" },
    { variant: "destructive", className: "bg-destructive", token: "--color-danger" },
  ];

  it.each(cases)(
    "renders $variant variant with correct class and token",
    ({ variant, className, token }) => {
      render(<Button variant={variant} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(className);
      expect(button).toHaveAttribute("data-token", token);
    }
  );

  it("renders custom component when asChild is true", () => {
    const CustomLink = React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement>
    >((props, ref) => <a ref={ref} data-testid="custom-link" {...props} />);

    render(
      <Button asChild>
        <CustomLink href="#">Click</CustomLink>
      </Button>
    );

    const link = screen.getByTestId("custom-link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("data-token", "--color-primary");
    expect(link).toHaveClass("bg-primary");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

