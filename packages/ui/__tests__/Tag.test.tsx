import React from "react";
import { render, screen } from "@testing-library/react";
import { Tag } from "../src/components/atoms/Tag";

describe("Tag", () => {
  it("applies variant classes and tokens", () => {
    const variants: Array<[any, string, string]> = [
      ["default", "--color-muted", "text-fg"],
      ["success", "--color-success", "text-success-fg"],
      ["warning", "--color-warning", "text-warning-fg"],
      ["destructive", "--color-danger", "text-danger-foreground"],
    ];
    for (const [v, token, textCls] of variants) {
      const { unmount } = render(<Tag variant={v as any}>X</Tag>);
      const el = screen.getByText("X");
      expect(el).toHaveAttribute("data-token", token);
      expect(el.className).toMatch(textCls);
      unmount();
    }
  });
});

