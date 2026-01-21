import { fireEvent, render, screen } from "@testing-library/react";

import { useTokenColors } from "../../../../hooks/useTokenColors";
import type { TokenMap } from "../../../../hooks/useTokenEditor";
import { hexToHsl } from "../../../../utils/colorUtils";
import { ColorToken } from "../ColorToken";

jest.mock("../../../../hooks/useTokenColors");
const mockedUseTokenColors =
  useTokenColors as jest.MockedFunction<typeof useTokenColors>;

describe("ColorToken", () => {
  const baseTokens: TokenMap = {
    "--color-bg": "0 0% 100%",
    "--color-fg": "0 0% 0%",
  };

  afterEach(() => {
    mockedUseTokenColors.mockReset();
  });

  it("renders without default value", () => {
    const setToken = jest.fn();
    mockedUseTokenColors.mockReturnValue(undefined as any);
    render(
      <ColorToken
        tokenKey="--color-bg"
        value="0 0% 100%"
        isOverridden={false}
        tokens={{}}
        baseTokens={baseTokens}
        setToken={setToken}
      />
    );

    expect(screen.queryByText(/Default:/)).toBeNull();
    expect(screen.queryByText("Reset")).toBeNull();
    expect(screen.queryByText(/Low contrast/)).toBeNull();
  });

  it("renders with default value", () => {
    const setToken = jest.fn();
    render(
      <ColorToken
        tokenKey="--color-bg"
        value="0 0% 100%"
        defaultValue="0 0% 100%"
        isOverridden={false}
        tokens={{}}
        baseTokens={baseTokens}
        setToken={setToken}
      />
    );

    expect(screen.getByText("--color-bg")).toBeInTheDocument();
    expect(screen.getByText(/Default:/)).toHaveTextContent("Default: 0 0% 100%");
    expect(screen.queryByText("Reset")).toBeNull();
  });

  it("emits updated value on change", () => {
    const setToken = jest.fn();
    const { container } = render(
      <ColorToken
        tokenKey="--color-bg"
        value="0 0% 100%"
        defaultValue="0 0% 100%"
        isOverridden={false}
        tokens={{}}
        baseTokens={baseTokens}
        setToken={setToken}
      />
    );

    const input = container.querySelector('input[type="color"]') as HTMLInputElement;
     
    fireEvent.change(input, { target: { value: "#000000" } });

     
    expect(setToken).toHaveBeenCalledWith("--color-bg", hexToHsl("#000000"));
  });

  it("resets to default value", () => {
    const setToken = jest.fn();
    render(
      <ColorToken
        tokenKey="--color-bg"
        value="0 0% 0%"
        defaultValue="0 0% 100%"
        isOverridden={true}
        tokens={{ "--color-bg": "0 0% 0%" }}
        baseTokens={baseTokens}
        setToken={setToken}
      />
    );

    fireEvent.click(screen.getByText("Reset"));
    expect(setToken).toHaveBeenCalledWith("--color-bg", "0 0% 100%");
  });

  it("shows warning for low contrast", () => {
    const setToken = jest.fn();
    mockedUseTokenColors.mockReturnValue({
      contrast: 2,
       
      suggestion: "#fff",
    });

    render(
      <ColorToken
        tokenKey="--color-bg"
        value="0 0% 0%"
        defaultValue="0 0% 100%"
        isOverridden={true}
        tokens={{ "--color-bg": "0 0% 0%" }}
        baseTokens={baseTokens}
        setToken={setToken}
      />
    );

    expect(screen.getByText(/Low contrast/)).toBeInTheDocument();
    expect(screen.getByText(/try #fff/)).toBeInTheDocument();
  });
});
