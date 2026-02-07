import { exportComponents } from "../exportComponents";

describe("exportComponents", () => {
  const list: any[] = [
    { id: "a", type: "Section", children: [{ id: "b", type: "Text" }] },
  ];

  it("stamps hiddenBreakpoints, hiddenDeviceIds, stackStrategy, orderMobile", () => {
    const editor: any = {
      a: { hidden: ["desktop"], hiddenDeviceIds: ["m-1"], stackStrategy: "reverse", orderMobile: 2 },
      b: { hidden: ["mobile"] },
    };
    const out = exportComponents(list as any, editor, null);
    const a = out[0];
    const b = a.children![0];
    expect(a.hiddenBreakpoints).toEqual(["desktop"]);
    expect(a.hiddenDeviceIds).toEqual(["m-1"]);
    expect(a.stackStrategy).toBe("reverse");
    expect(a.orderMobile).toBe(2);
    expect(b.hiddenBreakpoints).toEqual(["mobile"]);
  });

  it("applies global template override when provided, preserving id and applying overrides", () => {
    const list2: any[] = [{ id: "x", type: "Text", text: { en: "local" } }];
    const editor: any = { x: { global: { id: "g1", overrides: { text: { en: "override" } } } } };
    const globals: any = { g1: { id: "g1", type: "Text", text: { en: "global" } } };
    const out = exportComponents(list2 as any, editor, globals);
    expect(out[0].id).toBe("x");
    expect(out[0].text.en).toBe("override");
  });
});

