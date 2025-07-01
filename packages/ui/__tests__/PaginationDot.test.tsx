import { render } from "@testing-library/react";
import { PaginationDot } from "../components/atoms/PaginationDot";

describe("PaginationDot", () => {
  it("uses muted background by default", () => {
    const { container } = render(<PaginationDot />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "bg-muted"
    );
    expect((container.firstChild as HTMLElement).className).toContain("w-2");
    expect((container.firstChild as HTMLElement).className).toContain("h-2");
  });

  it("uses primary background when active", () => {
    const { container } = render(<PaginationDot active />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "bg-primary"
    );
  });

  it("applies custom size classes", () => {
    const { container } = render(<PaginationDot size="4" />);
    expect((container.firstChild as HTMLElement).className).toContain("w-4");
    expect((container.firstChild as HTMLElement).className).toContain("h-4");
  });
});
