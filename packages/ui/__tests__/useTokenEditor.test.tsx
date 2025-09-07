import { renderHook, act } from "@testing-library/react";
import { useTokenEditor } from "../src/hooks/useTokenEditor";

describe("useTokenEditor", () => {
  it("setToken updates tokens and triggers onChange", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useTokenEditor({ "--color-a": "red" }, { "--color-a": "red" }, onChange)
    );
    act(() => result.current.setToken("--color-a", "blue"));
    expect(onChange).toHaveBeenCalledWith({ "--color-a": "blue" });
  });

  it("marks tokens overridden relative to base tokens", () => {
    const { result } = renderHook(() =>
      useTokenEditor({ "--color-a": "blue" }, { "--color-a": "red" }, () => {})
    );
    expect(result.current.colors[0]).toMatchObject({
      key: "--color-a",
      defaultValue: "red",
      isOverridden: true,
      value: "blue",
    });
  });
});

