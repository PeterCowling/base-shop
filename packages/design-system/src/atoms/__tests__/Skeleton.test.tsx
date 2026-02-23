import "../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders with default styling", async () => {
    const { container } = render(<Skeleton />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("bg-muted", "animate-pulse", "rounded-md");

  });

  it("accepts custom className", () => {
    const { container } = render(<Skeleton className="p-2" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass(
      "bg-muted",
      "animate-pulse",
      "rounded-md",
      "p-2",
    );
  });

  it("supports shape/radius overrides", () => {
    const { container, rerender } = render(<Skeleton shape="square" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("rounded-none");

    rerender(<Skeleton shape="square" radius="xl" />);
    expect(container.firstChild as HTMLElement).toHaveClass("rounded-xl");
  });
});
