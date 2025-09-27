import React, { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import type { PageComponent } from "@acme/types";
import useInsertHandlers from "../useInsertHandlers";

function Harness(props: any) {
  const api = useInsertHandlers(props);
  useEffect(() => {
    props.onReady?.(api);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TEST-2417: api reference is stable for this harness
  }, [api]);
  return null;
}

const t = (k: string) => k;

describe("useInsertHandlers – insert index logic", () => {
  test("inserts at end when no selection and no placeholder index", async () => {
    const components: PageComponent[] = [
      { id: "a", type: "Section", children: [] } as any,
      { id: "b", type: "Text" } as any,
    ];
    const actions: any[] = [];
    render(
      <Harness
        components={components}
        selectedIds={[]}
        setSelectedIds={() => {}}
        insertIndex={null}
        dispatch={(a: any) => actions.push(a)}
        t={t}
        onReady={(api: any) => api.handleInsertImageAsset("/img.png")}
      />
    );

    await waitFor(() => {
      const add = actions.find((a) => a?.type === "add");
      expect(add).toBeTruthy();
      expect(add.index).toBe(components.length);
      expect(add.component?.type).toBe("Image");
    });
  });

  test("inserts after selected item when selection exists", () => {
    const components: PageComponent[] = [
      { id: "a", type: "Section", children: [] } as any,
      { id: "b", type: "Text" } as any,
    ];
    const actions: any[] = [];
    render(
      <Harness
        components={components}
        selectedIds={["a"]}
        setSelectedIds={() => {}}
        insertIndex={null}
        dispatch={(a: any) => actions.push(a)}
        t={t}
        onReady={(api: any) => api.handleInsertImageAsset("/img.png")}
      />
    );
    return waitFor(() => {
      const add = actions.find((a) => a?.type === "add");
      expect(add.index).toBe(1); // after id "a"
    });
  });

  test("respects placeholder insertIndex when provided", () => {
    const components: PageComponent[] = [
      { id: "a", type: "Section", children: [] } as any,
      { id: "b", type: "Text" } as any,
      { id: "c", type: "Text" } as any,
    ];
    const actions: any[] = [];
    render(
      <Harness
        components={components}
        selectedIds={["b"]}
        setSelectedIds={() => {}}
        insertIndex={0}
        dispatch={(a: any) => actions.push(a)}
        t={t}
        onReady={(api: any) => api.handleInsertImageAsset("/img.png")}
      />
    );
    return waitFor(() => {
      const add = actions.find((a) => a?.type === "add");
      expect(add.index).toBe(0);
    });
  });

  test("selectedIsSection true only for Section selection", () => {
    const components: PageComponent[] = [
      { id: "s1", type: "Section", children: [] } as any,
      { id: "t1", type: "Text" } as any,
    ];
    let selectedIsSectionA = false;
    let selectedIsSectionB = false;
    render(
      <>
        <Harness
          components={components}
          selectedIds={["s1"]}
          setSelectedIds={() => {}}
          insertIndex={null}
          dispatch={() => {}}
          t={t}
          onReady={(api: any) => (selectedIsSectionA = api.selectedIsSection)}
        />
        <Harness
          components={components}
          selectedIds={["t1"]}
          setSelectedIds={() => {}}
          insertIndex={null}
          dispatch={() => {}}
          t={t}
          onReady={(api: any) => (selectedIsSectionB = api.selectedIsSection)}
        />
      </>
    );
    expect(selectedIsSectionA).toBe(true);
    expect(selectedIsSectionB).toBe(false);
  });
});
