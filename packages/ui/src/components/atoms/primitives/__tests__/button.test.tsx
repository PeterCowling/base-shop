import "../../../../../../../test/resetNextMocks";
import * as React from "react";
import { render, screen, configure } from "@testing-library/react";
import { Button, type ButtonProps } from "../button";

configure({ testIdAttribute: "data-testid" });

describe("Button", () => {
  const variantCases: Array<{
    variant: NonNullable<ButtonProps["variant"]>;
    className: string;
    token: string;
  }> = [
    { variant: "default", className: "bg-primary", token: "--color-primary" },
    { variant: "outline", className: "border-input", token: "--color-accent" },
    { variant: "ghost", className: "hover:bg-accent", token: "--color-accent" },
    { variant: "destructive", className: "bg-destructive", token: "--color-danger" },
  ];

  it("renders with default variant when no props are provided", () => {
    render(<Button />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveAttribute("data-token", "--color-primary");
  });

  it("merges provided className with variant styles", () => {
    render(<Button className="custom-class" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards ref to the underlying DOM node", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref} />);
    const button = screen.getByRole("button");
    expect(ref.current).toBe(button);
  });

  it.each(variantCases)(
    "renders $variant variant with correct class and token",
    ({ variant, className, token }) => {
      render(<Button variant={variant} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass(className);
      expect(button).toHaveAttribute("data-token", token);
    }
  );

  it("honors disabled and forwards attributes", () => {
    render(<Button disabled aria-label="submit" data-testid="btn" />);
    const button = screen.getByTestId("btn");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "submit");
  });

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

