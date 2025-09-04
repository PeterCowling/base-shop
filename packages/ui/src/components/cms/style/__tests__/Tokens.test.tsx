import { render, fireEvent, screen } from "@testing-library/react";
import Tokens from "../Tokens";
import Presets from "../Presets";
import type { TokenMap } from "../../../../hooks/useTokenEditor";

describe("Tokens", () => {
  it("propagates token edits via onChange", () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 0%",
    };
    const handleChange = jest.fn();
    const { container, rerender } = render(
      <Tokens tokens={{}} baseTokens={baseTokens} onChange={handleChange} />
    );

    const input = container.querySelector(
      'label[data-token-key="--color-bg"] input'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#000000" } });

    expect(handleChange).toHaveBeenCalledWith({ "--color-bg": "0 0% 0%" });
  });

  it("resets token to default value", () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 0%",
    };
    const handleChange = jest.fn();
    render(
      <Tokens
        tokens={{ "--color-bg": "0 0% 0%" }}
        baseTokens={baseTokens}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText("Reset"));
    expect(handleChange).toHaveBeenCalledWith({ "--color-bg": "0 0% 100%" });
  });

  it("shows validation warning for low contrast colors", () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 0%",
    };
    const handleChange = jest.fn();
    const { container } = render(
      <Tokens tokens={{}} baseTokens={baseTokens} onChange={handleChange} />
    );

    const input = container.querySelector(
      'label[data-token-key="--color-bg"] input'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#000000" } });
    rerender(
      <Tokens
        tokens={{ "--color-bg": "0 0% 0%" }}
        baseTokens={baseTokens}
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/Low contrast/)).toBeInTheDocument();
  });
});

describe("Presets", () => {
  it("applies selected preset and resets tokens", () => {
    const handleChange = jest.fn();
    render(<Presets tokens={{}} baseTokens={{}} onChange={handleChange} />);

    fireEvent.change(screen.getByTestId("preset-select"), {
      target: { value: "brand" },
    });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ "--color-primary": "340 82% 52%" })
    );

    fireEvent.click(screen.getByTestId("preset-reset"));
    expect(handleChange).toHaveBeenLastCalledWith({});
  });
});

