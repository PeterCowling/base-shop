import { describe, it, expect } from "@jest/globals";
import { render, act } from "@testing-library/react";
import { useState } from "react";
import { useTokenEditor, type TokenMap } from "./useTokenEditor";

describe("useTokenEditor basic token behavior", () => {
  it("initializes with provided tokens", () => {
    function TestComponent() {
      const { colors } = useTokenEditor({ "--color-a": "red" }, {}, () => {});
      expect(colors[0]).toMatchObject({
        key: "--color-a",
        value: "red",
        isOverridden: false,
      });
      return null;
    }
    render(<TestComponent />);
  });

  it("updates token values correctly", () => {
    let setToken!: ReturnType<typeof useTokenEditor>["setToken"];
    let getColor!: () => string;

    function Wrapper() {
      const [tokens, setTokens] = useState<TokenMap>({ "--color-a": "red" });
      const hook = useTokenEditor(tokens, {}, (t) => setTokens(t));
      setToken = hook.setToken;
      getColor = () => hook.colors[0].value;
      return null;
    }

    render(<Wrapper />);
    act(() => setToken("--color-a", "blue"));
    expect(getColor()).toBe("blue");
  });

  it("reset returns tokens to base values", () => {
    let setToken!: ReturnType<typeof useTokenEditor>["setToken"];
    let reset!: () => void;
    let getInfo!: () => { value: string; isOverridden: boolean };

    function Wrapper() {
      const base = { "--color-a": "red" };
      const [tokens, setTokens] = useState<TokenMap>(base);
      const hook = useTokenEditor(tokens, base, (t) => setTokens(t));
      setToken = hook.setToken;
      reset = () => setTokens(base);
      getInfo = () => ({ value: hook.colors[0].value, isOverridden: hook.colors[0].isOverridden });
      return null;
    }

    render(<Wrapper />);
    act(() => setToken("--color-a", "blue"));
    expect(getInfo()).toEqual({ value: "blue", isOverridden: true });
    act(() => reset());
    expect(getInfo()).toEqual({ value: "red", isOverridden: false });
  });
});

