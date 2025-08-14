import { renderHook, act } from "@testing-library/react";
import { ulid } from "ulid";
import type { Page } from "@acme/types";
import usePageBuilderState from "../hooks/usePageBuilderState";

describe("usePageBuilderState", () => {
  const page: Page = {
    id: "p1",
    components: [],
    updatedAt: "", // minimal required fields
    slug: "",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    history: { past: [], present: [], future: [], gridCols: 12 },
  } as any;

  it("adds components and supports undo/redo", () => {
    const { result } = renderHook(() =>
      usePageBuilderState({ page })
    );

    act(() =>
      result.current.dispatch({
        type: "add",
        component: { id: ulid(), type: "Text" } as any,
      })
    );
    expect(result.current.components).toHaveLength(1);

    act(() => result.current.dispatch({ type: "undo" }));
    expect(result.current.components).toHaveLength(0);

    act(() => result.current.dispatch({ type: "redo" }));
    expect(result.current.components).toHaveLength(1);
  });
});
