import { add, duplicate, move, remove, resize, setGridCols } from "../layout";
import type { HistoryState, PageComponent } from "@acme/types";

describe("layout helper coordinate and size updates", () => {
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };
  const makeComp = (
    id: string,
    overrides: Partial<PageComponent> = {},
  ): PageComponent => ({
    id,
    type: "Box",
    left: "1px",
    top: "2px",
    width: "10px",
    height: "5px",
    ...overrides,
  });

  it("add keeps component coordinates and sizes", () => {
    const a = makeComp("a");
    const state = add(init, { type: "add", component: a });
    expect(state.present[0]).toMatchObject({
      left: "1px",
      top: "2px",
      width: "10px",
      height: "5px",
    });
  });

  it("duplicate copies coordinates and sizes", () => {
    const a = makeComp("a", { width: "15px", height: "20px", left: "3px", top: "4px" });
    const state = duplicate({ ...init, present: [a] }, { type: "duplicate", id: "a" });
    const clone = state.present[1];
    expect(clone).toMatchObject({
      left: "3px",
      top: "4px",
      width: "15px",
      height: "20px",
    });
  });

  it("move does not change coordinates", () => {
    const a = makeComp("a", { left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeComp("b", { left: "5px", top: "5px", width: "20px", height: "20px" });
    const state = move(
      { ...init, present: [a, b] },
      { type: "move", from: { index: 0 }, to: { index: 1 } },
    );
    expect(state.present[1]).toMatchObject({
      id: "a",
      left: "0px",
      top: "0px",
      width: "10px",
      height: "10px",
    });
    expect(state.present[0]).toMatchObject({
      id: "b",
      left: "5px",
      top: "5px",
      width: "20px",
      height: "20px",
    });
  });

  it("remove keeps remaining component coordinates", () => {
    const a = makeComp("a");
    const b = makeComp("b", { left: "5px" });
    const state = remove(
      { ...init, present: [a, b] },
      { type: "remove", id: "a" },
    );
    expect(state.present).toHaveLength(1);
    expect(state.present[0]).toMatchObject({ id: "b", left: "5px" });
  });

  it("resize normalizes numeric values", () => {
    const a = makeComp("a");
    const state = resize(
      { ...init, present: [a] },
      { type: "resize", id: "a", width: "20", height: "30", left: "5", top: "" },
    );
    const updated = state.present[0] as PageComponent & Record<string, string | undefined>;
    expect(updated.width).toBe("20px");
    expect(updated.height).toBe("30px");
    expect(updated.left).toBe("5px");
    // Blank top value leaves existing offset untouched
    expect(updated.top).toBe("2px");
  });

  it("resize ignores empty string values", () => {
    const a = makeComp("a", { width: "10px", height: "5px", left: "7px", top: "8px" });
    const state = resize(
      { ...init, present: [a] },
      { type: "resize", id: "a", width: "", height: "", left: "", top: "" },
    );
    const updated = state.present[0];
    expect(updated.width).toBe("10px");
    expect(updated.height).toBe("5px");
    expect(updated.left).toBe("7px");
    expect(updated.top).toBe("8px");
  });

  it("resize trims whitespace, handles decimals and negatives, and preserves invalid strings", () => {
    const a = makeComp("a");
    const state = resize(
      { ...init, present: [a] },
      {
        type: "resize",
        id: "a",
        width: " 15 ",
        height: "1.5",
        left: " -3",
        marginDesktop: " foo ",
      },
    );
    const updated = state.present[0] as PageComponent & Record<string, string | undefined>;
    expect(updated.width).toBe("15px");
    expect(updated.height).toBe("1.5px");
    expect(updated.left).toBe("-3px");
    // top offset not provided so it remains unchanged
    expect(updated.top).toBe("2px");
    // non-numeric strings are trimmed but otherwise untouched
    expect(updated.marginDesktop).toBe("foo");
  });

  it("resize normalizes margin and padding breakpoints", () => {
    const a = makeComp("a", {
      marginDesktop: "1px",
      paddingTablet: "5px",
    });
    const state = resize(
      { ...init, present: [a] },
      {
        type: "resize",
        id: "a",
        marginDesktop: "",
        marginTablet: "10",
        marginMobile: "",
        paddingDesktop: "12",
        paddingTablet: "",
        paddingMobile: "8",
      },
    );
    const updated = state.present[0] as PageComponent & Record<string, string | undefined>;
    expect(updated.marginDesktop).toBe("1px");
    expect(updated.marginTablet).toBe("10px");
    expect(updated.marginMobile).toBeUndefined();
    expect(updated.paddingDesktop).toBe("12px");
    expect(updated.paddingTablet).toBe("5px");
    expect(updated.paddingMobile).toBe("8px");
  });

  it("setGridCols updates grid column count", () => {
    const state = setGridCols(init, { type: "set-grid-cols", gridCols: 24 });
    expect(state.gridCols).toBe(24);
    expect(state.present).toEqual(init.present);
  });

  it("setGridCols leaves history untouched when populated", () => {
    const state: HistoryState = {
      past: [[makeComp("p")]],
      present: [makeComp("c")],
      future: [[makeComp("f")]],
      gridCols: 12,
    };
    const result = setGridCols(state, { type: "set-grid-cols", gridCols: 24 });
    expect(result.gridCols).toBe(24);
    expect(result.past).toBe(state.past);
    expect(result.present).toBe(state.present);
    expect(result.future).toBe(state.future);
  });
});
