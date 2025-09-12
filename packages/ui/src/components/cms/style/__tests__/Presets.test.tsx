import { render, fireEvent, screen } from "@testing-library/react";
import Presets from "../Presets";
import type { TokenMap } from "../../../../hooks/useTokenEditor";

describe("Presets", () => {
  const tokens: TokenMap = {};

  it("renders preset selector", () => {
    render(<Presets tokens={tokens} baseTokens={{}} onChange={jest.fn()} />);
    expect(screen.getByTestId("preset-select")).toBeInTheDocument();
    expect(screen.getByTestId("preset-reset")).toBeInTheDocument();
  });

  it("applies selected preset and resets tokens", () => {
    const handleChange = jest.fn();
    render(<Presets tokens={tokens} baseTokens={{}} onChange={handleChange} />);

    fireEvent.change(screen.getByTestId("preset-select"), {
      target: { value: "brand" },
    });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ "--color-primary": "340 82% 52%" })
    );

    fireEvent.click(screen.getByTestId("preset-reset"));
    expect(handleChange).toHaveBeenLastCalledWith({});
  });

  it("shows placeholder when no presets are available", async () => {
    jest.resetModules();
    jest.doMock("../presets.json", () => [], { virtual: true });
    const { default: Presets } = await import("../Presets");
    render(<Presets tokens={{}} baseTokens={{}} onChange={jest.fn()} />);
    expect(screen.getByText("No presets available")).toBeInTheDocument();
  });
});
