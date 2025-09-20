import { renderHook, act } from "@testing-library/react";
import usePageBuilderSave from "../hooks/usePageBuilderSave";

describe("usePageBuilderSave", () => {
  const basePage: any = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "home",
    status: "draft",
    seo: { title: { en: "Home" }, description: {} },
  };
  const components: any[] = [];
  const state: any = { past: [], present: [], future: [], gridCols: 12 };

  it("builds FormData and uses latest values on save", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();

    const { result, rerender } = renderHook(
      ({ page }: any) =>
        usePageBuilderSave({
          page,
          components,
          state,
          onSave,
          onPublish,
          formDataDeps: [],
          clearHistory,
        }),
      { initialProps: { page: basePage } }
    );

    const fd = result.current.formData;
    expect(fd.get("id")).toBe("p1");
    expect(fd.get("updatedAt")).toBe("2024-01-01");
    expect(fd.get("slug")).toBe("home");
    expect(fd.get("status")).toBe("draft");
    expect(fd.get("title")).toBe(JSON.stringify(basePage.seo.title));
    expect(fd.get("description")).toBe(
      JSON.stringify(basePage.seo.description)
    );
    expect(fd.get("components")).toBe(JSON.stringify(components));
    expect(fd.get("history")).toBe(JSON.stringify(state));

    await act(async () => {
      await result.current.handleSave();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].get("slug")).toBe("home");

    const newPage = { ...basePage, slug: "about" };
    rerender({ page: newPage });

    await act(async () => {
      await result.current.handleSave();
    });
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1][0].get("slug")).toBe("about");
  });

  it("clears history when page id changes", () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();

    const { rerender } = renderHook(
      ({ page }: any) =>
        usePageBuilderSave({
          page,
          components,
          state,
          onSave,
          onPublish,
          formDataDeps: [],
          clearHistory,
        }),
      { initialProps: { page: basePage } }
    );

    const newPage = { ...basePage, id: "p2" };
    act(() => {
      rerender({ page: newPage });
    });

    expect(clearHistory).toHaveBeenCalledTimes(1);
  });

  it("publishes and clears history", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();

    const editor = { p1: { hidden: ["desktop"] } } as any;
    const compList = [{ id: "p1", type: "Parent", children: [] }];
    const historyState = { past: [], present: [], future: [], gridCols: 12, editor } as any;

    const { result } = renderHook(() =>
      usePageBuilderSave({
        page: basePage,
        components: compList as any,
        state: historyState,
        onSave,
        onPublish,
        formDataDeps: [],
        clearHistory,
      })
    );

    await act(async () => {
      await result.current.handlePublish();
    });

    expect(onPublish).toHaveBeenCalledTimes(1);
    const sent = onPublish.mock.calls[0][0] as FormData;
    const exported = JSON.parse(String(sent.get("components")));
    expect(exported[0].hiddenBreakpoints).toEqual(["desktop"]);
    expect(clearHistory).toHaveBeenCalledTimes(1);
    expect(onPublish.mock.invocationCallOrder[0]).toBeLessThan(
      clearHistory.mock.invocationCallOrder[0]
    );
  });

  it("exposes autoSaveState from useAutoSave", async () => {
    jest.useFakeTimers();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();

    const { result, rerender } = renderHook(
      ({ deps }: any) =>
        usePageBuilderSave({
          page: basePage,
          components,
          state,
          onSave,
          onPublish,
          formDataDeps: deps,
          clearHistory,
        }),
      { initialProps: { deps: [0] } }
    );

    expect(result.current.autoSaveState).toBe("idle");

    rerender({ deps: [1] });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onSave).toHaveBeenCalledWith(expect.any(FormData));
    expect(result.current.autoSaveState).toBe("saved");

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.autoSaveState).toBe("idle");
    jest.useRealTimers();
  });

  it("calls onAutoSaveError on failure and retries", async () => {
    jest.useFakeTimers();
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();
    const onAutoSaveError = jest.fn();

    const { rerender, result } = renderHook(
      ({ deps }: any) =>
        usePageBuilderSave({
          page: basePage,
          components,
          state,
          onSave,
          onPublish,
          formDataDeps: deps,
          onAutoSaveError,
          clearHistory,
        }),
      { initialProps: { deps: [0] } }
    );

    rerender({ deps: [1] });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onAutoSaveError).toHaveBeenCalledTimes(1);
    expect(result.current.autoSaveState).toBe("error");
    const retry = onAutoSaveError.mock.calls[0][0];
    await act(async () => retry());
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.autoSaveState).toBe("saved");
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.autoSaveState).toBe("idle");
    jest.useRealTimers();
  });
});
