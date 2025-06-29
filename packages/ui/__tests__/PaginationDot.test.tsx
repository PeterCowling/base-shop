import { render } from "@testing-library/react";
import { PaginationDot } from "../components/atoms/PaginationDot";

describe("PaginationDot", () => {
  it("uses muted background by default", () => {
    const { container } = render(<PaginationDot />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "bg-muted"
    );
  });

  it("uses primary background when active", () => {
    const { container } = render(<PaginationDot active />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "bg-primary"
    );
  });
});
