import { beforeEach,describe, expect, it, jest } from "@jest/globals";
import { act,renderHook } from "@testing-library/react";

import { useMediaState } from "../useMediaState";

describe("useMediaState", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("initializes state with only items that have a url", () => {
    const items = [
      { url: "https://a/img.png", type: "image" },
      { type: "image" },
      { url: "https://b/img.png", type: "image" },
    ] as any[];

    const { result } = renderHook(() => useMediaState(items as any));
    expect(result.current.state.files.map((f) => f.url)).toEqual([
      "https://a/img.png",
      "https://b/img.png",
    ]);
    expect(result.current.state.selectedUrl).toBeNull();
    expect(result.current.state.dialogDeleteUrl).toBeNull();
    expect(result.current.state.deletePending).toBe(false);
    expect(result.current.state.metadataPending).toBe(false);
    expect(result.current.state.replacingUrl).toBeNull();
    expect(result.current.state.toast).toEqual({ open: false, message: "" });
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("updates state via provided action setters", () => {
    const { result } = renderHook(() => useMediaState([]));

    act(() => result.current.actions.setSelectedUrl("/x.png"));
    expect(result.current.state.selectedUrl).toBe("/x.png");

    act(() => result.current.actions.setDialogDeleteUrl("/del.png"));
    expect(result.current.state.dialogDeleteUrl).toBe("/del.png");

    act(() => result.current.actions.setDeletePending(true));
    expect(result.current.state.deletePending).toBe(true);

    act(() => result.current.actions.setMetadataPending(true));
    expect(result.current.state.metadataPending).toBe(true);

    act(() => result.current.actions.setReplacingUrl("/replace.png"));
    expect(result.current.state.replacingUrl).toBe("/replace.png");

    act(() => result.current.actions.setToast({ open: true, message: "ok" }));
    expect(result.current.state.toast).toEqual({ open: true, message: "ok" });

    act(() => result.current.actions.handleToastClose());
    expect(result.current.state.toast.open).toBe(false);

    act(() =>
      result.current.actions.setFiles([
        { url: "/a.png", type: "image" } as any,
        { url: "/b.png", type: "image" } as any,
      ])
    );
    expect(result.current.state.files.map((f) => f.url)).toEqual([
      "/a.png",
      "/b.png",
    ]);
  });
});

