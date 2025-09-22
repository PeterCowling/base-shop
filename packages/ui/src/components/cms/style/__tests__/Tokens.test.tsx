import {
  render,
  fireEvent,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import React from "react";
import Tokens from "../Tokens";
import Presets from "../Presets";
import * as tokenEditor from "../../../../hooks/useTokenEditor";
import type { TokenMap } from "../../../../hooks/useTokenEditor";
import { hexToHsl } from "../../../../utils/colorUtils";

jest.mock("../../../atoms/shadcn", () => {
  const actual = jest.requireActual("../../../atoms/shadcn");
  return {
    ...actual,
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({
      children,
      onSelect,
    }: {
      children: React.ReactNode;
      onSelect?: (event: Event) => void;
    }) => (
      <button type="button" onClick={() => onSelect?.(new Event("select"))}>
        {children}
      </button>
    ),
  };
});

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

  it.each([
    {
      name: "throws",
      impl: () => {
        throw new Error("fail");
      },
    },
    { name: "returns invalid JSON", impl: () => "not-json" },
  ])(
    "defaults groups open when localStorage.getItem %s",
    ({ impl }) => {
      const baseTokens: TokenMap = {
        "--color-bg": "0 0% 100%",
        "--font-sans": "system-ui",
      };
      const spy = jest
        .spyOn(window.localStorage.__proto__, "getItem")
        .mockImplementation(impl as never);
      const { container } = render(
        <Tokens tokens={{}} baseTokens={baseTokens} onChange={jest.fn()} />
      );
      expect(
        container.querySelector('label[data-token-key="--color-bg"]')
      ).toBeTruthy();
      expect(
        container.querySelector('label[data-token-key="--font-sans"]')
      ).toBeTruthy();
      spy.mockRestore();
    }
  );

  it("toggles group visibility when header clicked", () => {
    const baseTokens: TokenMap = {
      "--color-bg": "0 0% 100%",
      "--font-sans": "system-ui",
    };
    const { container } = render(
      <Tokens tokens={{}} baseTokens={baseTokens} onChange={jest.fn()} />
    );

    const button = screen.getByRole("button", { name: /Font/ });
    expect(
      container.querySelector('label[data-token-key="--font-sans"]')
    ).toBeTruthy();

    fireEvent.click(button);
    expect(
      container.querySelector('label[data-token-key="--font-sans"]')
    ).toBeNull();

    fireEvent.click(button);
    expect(
      container.querySelector('label[data-token-key="--font-sans"]')
    ).toBeTruthy();
  });

  it("adds custom font and clears input", () => {
    const baseTokens: TokenMap = { "--font-sans": "system-ui" };
    const realHook = tokenEditor.useTokenEditor;
    const addFontSpy = jest.fn();
    const hookSpy = jest
      .spyOn(tokenEditor, "useTokenEditor")
      .mockImplementation((tokens, defaults, onChange) => {
        const result = realHook(tokens, defaults, onChange);
        const wrapped = (...args: Parameters<typeof result.addCustomFont>) => {
          addFontSpy(...args);
          return result.addCustomFont(...args);
        };
        return { ...result, addCustomFont: wrapped };
      });

    render(<Tokens tokens={{}} baseTokens={baseTokens} onChange={jest.fn()} />);

    const input = screen.getByPlaceholderText("Add font stack") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Comic Sans" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(addFontSpy).toHaveBeenCalled();
    expect(input.value).toBe("");

    hookSpy.mockRestore();
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

  it("surfaces rename action when provided", () => {
    const baseTokens: TokenMap = { "--color-bg": "0 0% 100%" };
    const onRename = jest.fn();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("--color-brand");

    render(
      <Tokens
        tokens={baseTokens}
        baseTokens={baseTokens}
        onChange={jest.fn()}
        onRenameToken={onRename}
      />
    );

    const trigger = screen.getByLabelText("More actions for --color-bg");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("Rename token…"));

    expect(onRename).toHaveBeenCalledWith("--color-bg", "--color-brand");
    promptSpy.mockRestore();
  });

  it("normalizes hex input when replacing colors", () => {
    const baseTokens: TokenMap = { "--color-bg": "0 0% 100%" };
    const onReplace = jest.fn();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("#112233");

    render(
      <Tokens
        tokens={baseTokens}
        baseTokens={{}}
        onChange={jest.fn()}
        onReplaceColor={onReplace}
      />
    );

    const trigger = screen.getByLabelText("More actions for --color-bg");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("Replace across tokens…"));

    expect(onReplace).toHaveBeenCalledWith("--color-bg", hexToHsl("#112233"));
    promptSpy.mockRestore();
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

