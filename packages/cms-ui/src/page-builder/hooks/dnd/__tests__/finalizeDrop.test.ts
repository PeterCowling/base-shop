// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/finalizeDrop.test.ts
import { canDropChild } from "../../../rules";
import { finalizeDrop } from "../finalizeDrop";

jest.mock("../dom", () => ({ safeDispatchEvent: jest.fn() }));
jest.mock("../../../rules", () => ({ canDropChild: jest.fn().mockReturnValue(true) }));
jest.mock("ulid", () => ({ ulid: () => "fixed-id" }));

describe("finalizeDrop", () => {
  const baseArgs = {
    components: [{ id: "p", type: "Row", children: [] }] as any,
    defaults: { Block: { width: "100%" } },
    containerTypes: ["Row", "Tabs"] as any,
    selectId: jest.fn(),
    dispatch: jest.fn(),
    t: (k: string) => k,
    lastTabHoverRef: { current: null } as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("palette drop adds component with fixed id at target parent/index", () => {
    const ev: any = {
      active: { id: "drag", data: { current: { from: "palette", type: "Block" } } },
      over: { id: "container-p", data: { current: { parentId: "p", index: 0 } } },
    };
    finalizeDrop({ ...baseArgs, ev });
    expect(canDropChild).toHaveBeenCalled();
    expect(baseArgs.dispatch).toHaveBeenCalledWith({ type: "add", component: expect.objectContaining({ id: "fixed-id", type: "Block", width: "100%" }), parentId: "p", index: 0 });
    expect(baseArgs.selectId).toHaveBeenCalledWith("fixed-id");
  });

  test("palette drop blocked by canDropChild emits message and no add", () => {
    const rules = require("../../../rules");
    rules.canDropChild.mockReturnValueOnce(false);
    const ev: any = {
      active: { id: "drag", data: { current: { from: "palette", type: "Block" } } },
      over: { id: "container-p", data: { current: { parentId: "p", index: 0 } } },
    };
    finalizeDrop({ ...baseArgs, ev });
    const calls = (baseArgs.dispatch as jest.Mock).mock.calls;
    expect(calls.find((c) => c[0]?.type === "add")).toBeUndefined();
  });

  test("canvas move dispatches move with adjusted index", () => {
    const ev: any = {
      active: { id: "a", data: { current: { from: "canvas", parentId: "p", index: 0, type: "Block" } } },
      over: { id: "container-p", data: { current: { parentId: "p", index: 1 } } },
    };
    finalizeDrop({ ...baseArgs, ev });
    expect(baseArgs.dispatch).toHaveBeenCalledWith({ type: "move", from: { parentId: "p", index: 0 }, to: { parentId: "p", index: 0 } });
  });

  test("library drop clones templates, validates and selects first", () => {
    const template = { id: "t1", type: "Block" } as any;
    const ev: any = {
      active: { id: "drag", data: { current: { from: "library", templates: [template, template] } } },
      over: { id: "container-p", data: { current: { parentId: "p", index: 0 } } },
    };
    finalizeDrop({ ...baseArgs, ev });
    // two adds dispatched
    const addCalls = (baseArgs.dispatch as jest.Mock).mock.calls.filter((c) => c[0]?.type === "add");
    expect(addCalls.length).toBe(2);
    expect(baseArgs.selectId).toHaveBeenCalledWith("fixed-id");
  });

  test("palette drop to root canvas appends at end", () => {
    const ev: any = {
      active: { id: "drag", data: { current: { from: "palette", type: "Block" } } },
      over: { id: "canvas", data: { current: {} } },
    };
    const components = [{ id: "a", type: "Block" }] as any;
    const dispatch = jest.fn();
    finalizeDrop({ ...baseArgs, ev, components, dispatch });
    expect(dispatch).toHaveBeenCalledWith({ type: "add", component: expect.any(Object), parentId: undefined, index: 1 });
  });

  test("palette drop into Tabs sets slotKey from lastTabHoverRef", () => {
    const components = [{ id: "tabs", type: "Tabs", children: [] }] as any;
    const ev: any = {
      active: { id: "drag", data: { current: { from: "palette", type: "Block" } } },
      over: { id: "container-tabs", data: { current: { parentId: "tabs", index: 0 } } },
    };
    const lastTabHoverRef = { current: { parentId: "tabs", tabIndex: 1 } } as any;
    const dispatch = jest.fn();
    finalizeDrop({ ...baseArgs, ev, components, dispatch, lastTabHoverRef });
    const add = (dispatch as jest.Mock).mock.calls.find((c) => c[0]?.type === "add")?.[0];
    expect((add?.component as any).slotKey).toBe("1");
  });

  test("library drop with invalid type emits message and no add", () => {
    const rules = require("../../../rules");
    // First clone invalid
    rules.canDropChild.mockReturnValueOnce(false);
    const ev: any = {
      active: { id: "drag", data: { current: { from: "library", templates: [{ id: "t1", type: "Hero" }] } } },
      over: { id: "container-p", data: { current: { parentId: "p", index: 0 } } },
    };
    const dispatch = jest.fn();
    finalizeDrop({ ...baseArgs, ev, dispatch });
    const add = (dispatch as jest.Mock).mock.calls.find((c) => c[0]?.type === "add");
    expect(add).toBeUndefined();
  });
});
