import { renderHook, act } from "@testing-library/react";
import { useMappingRows } from "../useMappingRows";

describe("useMappingRows", () => {
  it("manages rows", () => {
    const { result } = renderHook(() => useMappingRows({ a: 1 }));

    expect(result.current.rows).toEqual([{ key: "a", value: "1" }]);

    act(() => result.current.add());
    expect(result.current.rows).toHaveLength(2);

    act(() => result.current.update(1, "key", "b"));
    act(() => result.current.update(1, "value", "2"));
    expect(result.current.rows[1]).toEqual({ key: "b", value: "2" });

    act(() => result.current.remove(0));
    expect(result.current.rows).toEqual([{ key: "b", value: "2" }]);
  });
});
