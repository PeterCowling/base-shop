import {
  render,
  fireEvent,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import Tokens from "../Tokens";
import Presets from "../Presets";
import type { TokenMap } from "../../../../hooks/useTokenEditor";

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
});

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
    const { container, rerender } = render(
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

    expect(screen.getAllByText(/Low contrast/)).toHaveLength(2);
  });

  it("filters tokens based on search text", () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 0%",
    };
    const { container } = render(
      <Tokens tokens={{}} baseTokens={baseTokens} onChange={jest.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText("Search tokens"), {
      target: { value: "fg" },
    });

    expect(
      container.querySelector('label[data-token-key="--color-fg"]')
    ).toBeTruthy();
    expect(
      container.querySelector('label[data-token-key="--color-bg"]')
    ).toBeNull();
  });

  it("persists group open state to localStorage", async () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--font-sans": "system-ui",
    };
    render(<Tokens tokens={{}} baseTokens={baseTokens} onChange={jest.fn()} />);

    const button = screen.getByRole("button", { name: /Font/ });
    fireEvent.click(button);

    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("token-group-state") as string)
      ).toMatchObject({ font: false })
    );
  });

  it("scrolls focused token into view with temporary highlight", () => {
    const baseTokens: TokenMap = { "--color-bg": "0 0% 100%" };
    const scrollIntoView = jest.fn();
    const original = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    jest.useFakeTimers();

    const { container } = render(
      <Tokens
        tokens={{}}
        baseTokens={baseTokens}
        onChange={jest.fn()}
        focusToken="--color-bg"
      />
    );

    const el = container.querySelector(
      'label[data-token-key="--color-bg"]'
    ) as HTMLElement;
    expect(scrollIntoView).toHaveBeenCalled();
    expect(el.classList.contains("ring-2")).toBe(true);
    expect(el.dataset.token).toBe("--color-info");

    act(() => {
      jest.runAllTimers();
    });

    expect(el.classList.contains("ring-2")).toBe(false);
    expect(el.dataset.token).toBeUndefined();

    window.HTMLElement.prototype.scrollIntoView = original;
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

