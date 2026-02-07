import { exportComponents } from "../state/exportComponents";

describe("exportComponents", () => {
  it("stamps hiddenBreakpoints and stackStrategy into nodes", () => {
    const components: any[] = [
      { id: "p", type: "Parent", children: [{ id: "c", type: "Child" }] },
    ];
    const editor: any = {
      p: { hidden: ["desktop"] as const, stackStrategy: "reverse" },
      c: { hidden: ["mobile", "tablet"] as const },
    };
    const out = exportComponents(components as any, editor);
    expect(out[0].hiddenBreakpoints).toEqual(["desktop"]);
    expect(out[0].stackStrategy).toBe("reverse");
    expect(out[0].children?.[0].hiddenBreakpoints).toEqual([
      "mobile",
      "tablet",
    ]);
  });
});

