import { act, fireEvent,renderHook } from "@testing-library/react";

import usePageBuilderState from "../src/components/cms/page-builder/hooks/usePageBuilderState";

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

  it("persists history to localStorage and clears it", () => {
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
      expect.any(String)
    );
    const stored = JSON.parse((setItem as jest.Mock).mock.calls[0][1]);
    expect(stored).toEqual(expect.objectContaining(history));
    act(() => result.current.clearHistory());
    expect(removeItem).toHaveBeenCalledWith("page-builder-history-p1");
  });

  it("uses default state when history prop fails schema parsing", () => {
    const page = {
      ...basePage,
      components: [{ id: "base", type: "Text" }],
    };
    const invalidHistory = {
      past: [],
      present: [],
      future: [],
      gridCols: "bad",
    } as any;
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValueOnce(null);
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() =>
      usePageBuilderState({ page, history: invalidHistory })
    );
    expect(getItem).toHaveBeenCalledWith("page-builder-history-p1");
    expect(result.current.state).toEqual(
      expect.objectContaining({
        past: [],
        present: page.components,
        future: [],
        gridCols: 12,
      })
    );
    expect(setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      expect.any(String)
    );
    const stored2 = JSON.parse((setItem as jest.Mock).mock.calls.slice(-1)[0][1]);
    expect(stored2).toEqual(
      expect.objectContaining({
        past: [],
        present: page.components,
        future: [],
        gridCols: 12,
      })
    );
  });

  it("uses server history when localStorage is empty", () => {
    const serverHistory = {
      past: [],
      present: [{ id: "h1", type: "Text" }],
      future: [],
      gridCols: 12,
    };
    const page = {
      ...basePage,
      components: [{ id: "base", type: "Text" }],
      history: serverHistory,
    };
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValueOnce(null);
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => usePageBuilderState({ page }));
    expect(getItem).toHaveBeenCalledWith("page-builder-history-p1");
    expect(result.current.state).toEqual(
      expect.objectContaining(serverHistory)
    );
    expect(result.current.components).toEqual(serverHistory.present);
    expect(setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      expect.any(String)
    );
    const stored3 = JSON.parse((setItem as jest.Mock).mock.calls.slice(-1)[0][1]);
    expect(stored3).toEqual(expect.objectContaining(serverHistory));
  });

  it("falls back to server history on malformed localStorage JSON", () => {
    const serverHistory = {
      past: [],
      present: [{ id: "h1", type: "Text" }],
      future: [],
      gridCols: 12,
    };
    const page = {
      ...basePage,
      components: [{ id: "base", type: "Text" }],
      history: serverHistory,
    };
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValueOnce("{");
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => usePageBuilderState({ page }));
    expect(getItem).toHaveBeenCalledWith("page-builder-history-p1");
    expect(result.current.state).toEqual(
      expect.objectContaining(serverHistory)
    );
    expect(result.current.components).toEqual(serverHistory.present);
    expect(setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      JSON.stringify(result.current.state)
    );
  });

  it("updates liveMessage on actions", () => {
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
      })
    );
    expect(result.current.liveMessage).toBe("Block resized");
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
