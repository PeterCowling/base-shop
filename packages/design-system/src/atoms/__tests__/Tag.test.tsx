import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { Tag } from "../Tag";

describe("Tag", () => {
  const variants = [
    {
      label: "Default",
      variant: undefined,
      bgClass: "bg-muted",
      textClass: "text-fg",
      token: "--color-muted",
      tokenFg: "--color-fg",
    },
    {
      label: "Success",
      variant: "success" as const,
      bgClass: "bg-success",
      textClass: "text-success-fg",
      token: "--color-success",
      tokenFg: "--color-success-fg",
    },
    {
      label: "Warning",
      variant: "warning" as const,
      bgClass: "bg-warning",
      textClass: "text-warning-fg",
      token: "--color-warning",
      tokenFg: "--color-warning-fg",
    },
    {
      label: "Destructive",
      variant: "destructive" as const,
      bgClass: "bg-danger",
      textClass: "text-danger-foreground",
      token: "--color-danger",
      tokenFg: "--color-danger-fg",
    },
  ];

  it.each(variants)(
    "%s variant applies correct styles",
    ({ label, variant, bgClass, textClass, token, tokenFg }) => {
      render(<Tag variant={variant}>{label}</Tag>);
      const tag = screen.getByText(label);
      expect(tag).toHaveClass(bgClass, textClass);
      expect(tag).toHaveAttribute("data-token", token);
      expect(tag).toHaveAttribute("data-token-fg", tokenFg);
    }
  );
});
