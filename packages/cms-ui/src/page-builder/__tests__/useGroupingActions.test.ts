import { act,renderHook } from "@testing-library/react";

import useGroupingActions from "../hooks/useGroupingActions";

jest.mock("ulid", () => ({ ulid: () => "gid" }));

describe("useGroupingActions", () => {
  const a = { id: "a", type: "Text" } as any;
  const b = { id: "b", type: "Text" } as any;

  it("groupAs ignores when fewer than 2 selected", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useGroupingActions({ components: [a, b], selectedIds: ["a"], dispatch }));
    act(() => { result.current.groupAs("Section"); });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("groupAs groups siblings into a container", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useGroupingActions({ components: [a, b], selectedIds: ["a", "b"], dispatch }));
    act(() => { result.current.groupAs("MultiColumn"); });
    expect(dispatch).toHaveBeenCalledTimes(1);
    const payload = (dispatch.mock.calls[0]?.[0]) as any;
    expect(payload.type).toBe("set");
    expect(Array.isArray(payload.components)).toBe(true);
    expect(payload.components).toHaveLength(1);
    const container = payload.components[0] as any;
    expect(container.type).toBe("MultiColumn");
    expect(container.children).toHaveLength(2);
  });

  it("ungroup ignores when selection is not exactly 1", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => useGroupingActions({ components: [a, b], selectedIds: [], dispatch }));
    act(() => { result.current.ungroup(); });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ungroup splits a container into its children", () => {
    // First, group them
    const firstDispatch = jest.fn();
    const { result: r1 } = renderHook(() => useGroupingActions({ components: [a, b], selectedIds: ["a", "b"], dispatch: firstDispatch }));
    act(() => { r1.current.groupAs("Section"); });
    const grouped = (firstDispatch.mock.calls[0][0] as any).components as any[];
    const containerId = grouped[0].id as string;

    // Then ungroup
    const dispatch = jest.fn();
    const { result } = renderHook(() => useGroupingActions({ components: grouped, selectedIds: [containerId], dispatch }));
    act(() => { result.current.ungroup(); });
    const payload = (dispatch.mock.calls[0][0]) as any;
    expect(payload.type).toBe("set");
    expect(payload.components).toHaveLength(2);
  });
});

