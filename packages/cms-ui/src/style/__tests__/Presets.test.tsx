import { fireEvent, render, screen } from "@testing-library/react";

import type { TokenMap } from "@acme/ui/hooks/useTokenEditor";

import Presets from "../Presets";

describe("Presets", () => {
  const tokens: TokenMap = {};

  it("renders preset selector", () => {
    render(<Presets tokens={tokens} baseTokens={{}} onChange={jest.fn()} />);
    expect(screen.getByLabelText(/preset/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /default/i })).toBeInTheDocument();
  });

  it("applies selected preset and resets tokens", () => {
    const handleChange = jest.fn();
    render(<Presets tokens={tokens} baseTokens={{}} onChange={handleChange} />);

    fireEvent.change(screen.getByLabelText(/preset/i), {
      target: { value: "brand" },
    });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ "--color-primary": "340 82% 52%" })
    );

    fireEvent.click(screen.getByRole("button", { name: /default/i }));
    expect(handleChange).toHaveBeenLastCalledWith({});
  });

  it("does not trigger onChange for unknown preset", () => {
    const handleChange = jest.fn();
    render(<Presets tokens={tokens} baseTokens={{}} onChange={handleChange} />);

    fireEvent.change(screen.getByLabelText(/preset/i), {
      target: { value: "unknown" },
    });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it("shows placeholder when no presets are available", async () => {
    jest.resetModules();
    jest.doMock("../presets.json", () => [], { virtual: true });
    const { default: Presets } = await import("../Presets");
    render(<Presets tokens={{}} baseTokens={{}} onChange={jest.fn()} />);
    expect(screen.getByText("No presets available")).toBeInTheDocument();
  });
});
