import { act, fireEvent,renderHook } from "@testing-library/react";

import usePageBuilderState from "@acme/ui/hooks/usePageBuilderState";

describe("usePageBuilderState", () => {
  const basePage: any = {
    id: "p1",
    updatedAt: "now",
    slug: "home",
    status: "draft",
    seo: { title: { en: "Home" } },
    components: [],
  };

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("falls back to default state for invalid history", () => {
    const page = {
      ...basePage,
      components: [{ id: "c0", type: "Text" }],
    };
    const badHistory: any = {
      past: [],
      present: [],
      future: [],
      // gridCols should be a number; using a string triggers schema fallback
      gridCols: "invalid",
    };

    const { result } = renderHook(() =>
      usePageBuilderState({ page, history: badHistory })
    );

    expect(result.current.state).toEqual({
      past: [],
      present: page.components,
      future: [],
      gridCols: 12,
      editor: {},
    } as any);
  });

  it("loads history from localStorage and clears it", () => {
    const history = {
      past: [],
      present: [{ id: "c1", type: "Text" }],
      future: [],
      gridCols: 12,
    };
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValueOnce(JSON.stringify(history));
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    const removeItem = jest.spyOn(Storage.prototype, "removeItem");

    const { result } = renderHook(() => usePageBuilderState({ page: basePage }));
    expect(getItem).toHaveBeenCalledWith("page-builder-history-p1");
    expect(result.current.components).toEqual(history.present);
    expect(setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      JSON.stringify(result.current.state)
    );
    act(() => result.current.clearHistory());
    expect(removeItem).toHaveBeenCalledWith("page-builder-history-p1");
  });

  it("updates liveMessage for add, move, and resize actions", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePageBuilderState({ page: basePage }));

    act(() =>
      result.current.dispatch({
        type: "add",
        component: { id: "c1", type: "Text" } as any,
      })
    );
    expect(result.current.liveMessage).toBe("Block added");
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.liveMessage).toBe("");

    act(() =>
      result.current.dispatch({
        type: "move",
        from: { index: 0 },
        to: { index: 0 },
      })
    );
    expect(result.current.liveMessage).toBe("Block moved");
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.liveMessage).toBe("");

    act(() =>
      result.current.dispatch({
        type: "resize",
        id: "c1",
        width: "100",
      } as any)
    );
    expect(result.current.liveMessage).toBe("Block resized");
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.liveMessage).toBe("");
  });

  it("handles keyboard shortcuts", () => {
    const onSave = jest.fn();
    const onPreview = jest.fn();
    const onRotate = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderState({
        page: basePage,
        onSaveShortcut: onSave,
        onTogglePreview: onPreview,
        onRotateDevice: onRotate,
      })
    );

    act(() =>
      result.current.dispatch({
        type: "add",
        component: { id: "c1", type: "Text" } as any,
      })
    );
    expect(result.current.components).toHaveLength(1);

    act(() => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });
    expect(result.current.components).toHaveLength(0);

    act(() => {
      fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    });
    expect(result.current.components).toHaveLength(1);

    act(() => {
      fireEvent.keyDown(window, { key: "s", ctrlKey: true });
    });
    expect(onSave).toHaveBeenCalled();

    act(() => {
      fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    });
    expect(onPreview).toHaveBeenCalled();

    act(() => {
      fireEvent.keyDown(window, {
        key: "[",
        ctrlKey: true,
        shiftKey: true,
      });
    });
    expect(onRotate).toHaveBeenCalledWith("left");

    act(() => {
      fireEvent.keyDown(window, {
        key: "]",
        ctrlKey: true,
        shiftKey: true,
      });
    });
    expect(onRotate).toHaveBeenCalledWith("right");
  });
});
