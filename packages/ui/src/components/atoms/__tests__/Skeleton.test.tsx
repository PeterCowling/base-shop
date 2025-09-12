import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import { Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders with default styling", () => {
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
});
