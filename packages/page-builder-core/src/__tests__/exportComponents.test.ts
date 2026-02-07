import type { HistoryState, PageComponent } from "@acme/types";

import { exportComponents, exportComponentsFromHistory } from "../runtime/exportComponents";

describe("exportComponents", () => {
  const list: PageComponent[] = [
    { id: "a", type: "Section", children: [{ id: "b", type: "Text" }] } as unknown as PageComponent,
  ];

  it("stamps hiddenBreakpoints, hiddenDeviceIds, stackStrategy, orderMobile", () => {
    const editor: NonNullable<HistoryState["editor"]> = {
      a: { hidden: ["desktop"], hiddenDeviceIds: ["m-1"], stackStrategy: "reverse", orderMobile: 2 },
      b: { hidden: ["mobile"] },
    } as unknown as NonNullable<HistoryState["editor"]>;

    const out = exportComponents(list, editor, null);
    const a = out[0];
    const b = a.children![0];

    expect(a.hiddenBreakpoints).toEqual(["desktop"]);
    expect(a.hiddenDeviceIds).toEqual(["m-1"]);
    expect(a.stackStrategy).toBe("reverse");
    expect(a.orderMobile).toBe(2);
    expect(b.hiddenBreakpoints).toEqual(["mobile"]);
  });

  it("applies global template override when provided, preserving id and applying overrides", () => {
    const list2: PageComponent[] = [
      { id: "x", type: "Text", text: { en: "local" } } as unknown as PageComponent,
    ];
    const editor: NonNullable<HistoryState["editor"]> = {
      x: {
        global: {
          id: "g1",
          overrides: { text: { en: "override" } },
        },
      },
    } as unknown as NonNullable<HistoryState["editor"]>;
    const globals: Record<string, PageComponent> = {
      g1: { id: "g1", type: "Text", text: { en: "global" } } as unknown as PageComponent,
    };

    const out = exportComponents(list2, editor, globals);
    expect(out[0].id).toBe("x");
    expect((out[0] as any).text.en).toBe("override");
  });
});

describe("exportComponentsFromHistory", () => {
  it("uses present from history and editor metadata", () => {
    const history = {
      past: [],
      present: [{ id: "p", type: "Section" }] as PageComponent[],
      future: [],
      gridCols: 12,
      editor: {
        p: { hidden: ["desktop"] },
      },
    } as unknown as HistoryState;

    const out = exportComponentsFromHistory(history, null);
    expect(out).toHaveLength(1);
    expect(out[0].hiddenBreakpoints).toEqual(["desktop"]);
  });

  it("returns empty list when history is nullish", () => {
    expect(exportComponentsFromHistory(undefined, null)).toEqual([]);
    expect(exportComponentsFromHistory(null, null)).toEqual([]);
  });
});
