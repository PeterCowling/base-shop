import { renderHook, act } from "@testing-library/react";
import usePageBuilderSave from "../src/components/cms/page-builder/hooks/usePageBuilderSave";

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

    const { result, rerender } = renderHook(({ page }: any) =>
      usePageBuilderSave({
        page,
        components,
        state,
        onSave,
        onPublish,
        formDataDeps: [],
        clearHistory,
      })
    , { initialProps: { page: basePage } });

    const fd = result.current.formData;
    expect(fd.get("id")).toBe("p1");
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

    const { rerender } = renderHook(({ page }: any) =>
      usePageBuilderSave({
        page,
        components,
        state,
        onSave,
        onPublish,
        formDataDeps: [],
        clearHistory,
      })
    , { initialProps: { page: basePage } });

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

    const { result } = renderHook(() =>
      usePageBuilderSave({
        page: basePage,
        components,
        state,
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
    expect(clearHistory).toHaveBeenCalledTimes(1);
  });

  it("calls onAutoSaveError on failure", async () => {
    jest.useFakeTimers();
    const onSave = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const clearHistory = jest.fn();
    const onAutoSaveError = jest.fn();

    const { rerender } = renderHook(({ deps }: any) =>
      usePageBuilderSave({
        page: basePage,
        components,
        state,
        onSave,
        onPublish,
        formDataDeps: deps,
        onAutoSaveError,
        clearHistory,
      })
    , { initialProps: { deps: [0] } });

    rerender({ deps: [1] });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onAutoSaveError).toHaveBeenCalledTimes(1);
    const retry = onAutoSaveError.mock.calls[0][0];
    await act(async () => retry());
    expect(onSave).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});

