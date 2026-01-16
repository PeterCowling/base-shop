import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PinInput from "../PinInput";

describe("PinInput", () => {
  it("renders a title when provided", () => {
    render(<PinInput onChange={vi.fn()} title="Test PIN" />);
    expect(screen.getByText("Test PIN")).toBeInTheDocument();
  });

  it("does not render a title when none provided", () => {
    const { container } = render(<PinInput onChange={vi.fn()} />);
    expect(container.querySelector("h2")).toBeNull();
  });
});
