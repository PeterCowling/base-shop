import { finalizeDrop } from "@acme/ui/hooks/dnd/finalizeDrop";

describe("finalizeDrop", () => {
  it("corrects move index when moving down within same parent", () => {
    const components = [
      { id: "p", type: "Section", children: [
        { id: "a", type: "Text" },
        { id: "b", type: "Text" },
        { id: "c", type: "Text" },
      ] },
    ] as any;
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    const ev: any = {
      active: { id: "a", data: { current: { from: "canvas", index: 0, parentId: "p", type: "Text" } } },
      over: { id: "b", data: { current: { parentId: "p", index: 2 } } },
    };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef: { current: null } as any });
    // toIndex corrected to 1 since moving from 0 past index 1
    expect(calls.find((x) => x?.type === "move")).toEqual({ type: "move", from: { parentId: "p", index: 0 }, to: { parentId: "p", index: 1 } });
  });

  it("emits live message and aborts when dropping disallowed type from library at ROOT", () => {
    const components: any[] = [];
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    const messages: any[] = [];
    const listener = (e: any) => messages.push(e.detail);
    window.addEventListener("pb-live-message", listener as any);
    const ev: any = {
      active: { id: "lib", data: { current: { from: "library", templates: [{ id: "x", type: "Text" }] } } },
      over: { id: "canvas", data: { current: {} } },
    };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef: { current: null } as any });
    window.removeEventListener("pb-live-message", listener as any);
    expect(calls.length).toBe(0);
    expect(messages.length).toBeGreaterThan(0);
  });

  it("assigns slotKey when adding to a tabbed container via palette", () => {
    const components = [ { id: "tabs1", type: "TabsAccordionContainer", children: [] } ] as any;
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    const ev: any = {
      active: { id: "new", data: { current: { from: "palette", type: "Text" } } },
      over: { id: "container-tabs1", data: { current: { parentId: "tabs1", index: 0 } } },
    };
    const lastTabHoverRef: any = { current: { parentId: "tabs1", tabIndex: 2 } };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef });
    const add = calls.find((x) => x?.type === "add");
    expect(add).toBeTruthy();
    expect((add as any).component.slotKey).toBe("2");
  });

  it("infers parent when over child and parentId missing in over.data", () => {
    const components = [
      { id: "root", type: "Section", children: [
        { id: "p", type: "Section", children: [ { id: "b", type: "Text" }, { id: "c", type: "Text" } ] },
        { id: "a", type: "Text" },
      ] },
    ] as any;
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    const ev: any = {
      active: { id: "a", data: { current: { from: "canvas", index: 1, parentId: undefined, type: "Text" } } },
      over: { id: "b", data: { current: { /* parentId intentionally missing */ } } },
    };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef: { current: null } as any });
    const move = calls.find((x) => x?.type === "move");
    expect(move).toEqual({ type: "move", from: { parentId: undefined, index: 1 }, to: { parentId: "p", index: 0 } });
  });

  it("infers parent and applies same-parent index correction when moving down", () => {
    const components = [
      { id: "p", type: "Section", children: [ { id: "a", type: "Text" }, { id: "b", type: "Text" }, { id: "c", type: "Text" } ] },
    ] as any;
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    // Move 'a' over 'c' (parentId missing in over.data)
    const ev: any = {
      active: { id: "a", data: { current: { from: "canvas", index: 0, parentId: "p", type: "Text" } } },
      over: { id: "c", data: { current: { /* no parentId */ } } },
    };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef: { current: null } as any });
    // findIndex(c) = 2; since same parent and from.index < index → toIndex = index - 1 = 1
    expect(calls.find((x) => x?.type === "move")).toEqual({ type: "move", from: { parentId: "p", index: 0 }, to: { parentId: "p", index: 1 } });
  });

  it("infers parent over child above midpoint → move up no correction (toIndex = index)", () => {
    const components = [
      { id: "p", type: "Section", children: [ { id: "a", type: "Text" }, { id: "b", type: "Text" }, { id: "c", type: "Text" } ] },
    ] as any;
    const calls: any[] = [];
    const dispatch = (a: any) => calls.push(a);
    // Move 'c' over 'b' (parent inferred); since moving up, toIndex should equal index (1)
    const ev: any = {
      active: { id: "c", data: { current: { from: "canvas", index: 2, parentId: "p", type: "Text" } } },
      over: { id: "b", data: { current: { /* no parentId */ } } },
    };
    finalizeDrop({ ev, components, dispatch, defaults: {}, containerTypes: [], selectId: () => {}, lastTabHoverRef: { current: null } as any });
    expect(calls.find((x) => x?.type === "move")).toEqual({ type: "move", from: { parentId: "p", index: 2 }, to: { parentId: "p", index: 1 } });
  });
});
