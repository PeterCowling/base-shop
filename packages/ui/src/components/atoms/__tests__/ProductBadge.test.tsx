import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { ProductBadge } from "../ProductBadge";

describe("ProductBadge", () => {
  const cases = [
    ["default", "bg-muted", "--color-muted", "text-fg", "--color-fg"],
    ["sale", "bg-danger", "--color-danger", "text-danger-foreground", "--color-danger-fg"],
    ["new", "bg-success", "--color-success", "text-success-fg", "--color-success-fg"],
  ] as const;

  it.each(cases)(
    "applies %s variant styles",
    (variant, bgClass, bgToken, textClass, textToken) => {
      render(<ProductBadge label="Label" variant={variant} />);
      const inner = screen.getByText("Label");
      const outer = inner.parentElement as HTMLElement;
      expect(outer).toHaveClass(bgClass);
      expect(outer).toHaveAttribute("data-token", bgToken);
      expect(inner).toHaveClass(textClass);
      expect(inner).toHaveAttribute("data-token", textToken);
    }
  );
});

