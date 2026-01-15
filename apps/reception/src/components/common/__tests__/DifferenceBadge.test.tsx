import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DifferenceBadge } from "../DifferenceBadge";

describe("DifferenceBadge", () => {
  it("renders positive values", () => {
    const { container } = render(<DifferenceBadge value={2.5} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveTextContent(/\+\s*2\.50/);
    expect(badge).toHaveClass("bg-success-main", "text-white");
  });

  it("renders negative values", () => {
    const { container } = render(<DifferenceBadge value={-3} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveTextContent(/-\s*3/);
    expect(badge).toHaveClass("bg-error-main", "text-white");
  });

  it("applies dark mode classes", () => {
    const { container } = render(
      <div className="dark">
        <DifferenceBadge value={5} />
      </div>
    );
    const badge = container.querySelector("span") as HTMLElement;
    expect(badge.className).toContain("dark:bg-darkAccentGreen");
  });
});
