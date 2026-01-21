import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import PinInput from "../PinInput";

describe("PinInput", () => {
  it("renders a title when provided", () => {
    render(<PinInput onChange={jest.fn()} title="Test PIN" />);
    expect(screen.getByText("Test PIN")).toBeInTheDocument();
  });

  it("does not render a title when none provided", () => {
    const { container } = render(<PinInput onChange={jest.fn()} />);
    expect(container.querySelector("h2")).toBeNull();
  });
});
