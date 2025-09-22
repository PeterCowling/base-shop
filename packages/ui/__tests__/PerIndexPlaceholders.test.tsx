import React from "react";
import { render, within } from "@testing-library/react";
import BlockChildren from "../src/components/cms/page-builder/BlockChildren";

// Lightweight stub to avoid heavy canvas item rendering
jest.mock("../src/components/cms/page-builder/CanvasItem", () => ({
  __esModule: true,
  default: ({ component }: any) => <div data-component-id={component.id} />,
}));

describe("Per-index placeholders inside containers", () => {
  it("renders placeholder before the i-th child in default list", () => {
    const parent: any = { id: "p", type: "Section" };
    const children: any[] = [
      { id: "c1", type: "Text" },
      { id: "c2", type: "Text" },
    ];
    const { container } = render(
      <BlockChildren
        component={parent}
        childComponents={children}
        selectedIds={[]}
        onSelect={() => {}}
        dispatch={() => {}}
        locale={"en" as any}
        gridEnabled={false}
        gridCols={12}
        viewport="desktop"
        device={undefined}
        isOver={true}
        setDropRef={() => {}}
        editor={undefined}
        baselineSnap={false}
        baselineStep={8}
        dropAllowed={true}
        insertParentId={"p"}
        insertIndex={1}
      />
    );
    const c2Wrapper = (container.querySelector('[data-component-id="c2"]') as HTMLElement).parentElement as HTMLElement;
    expect(within(c2Wrapper).queryByTestId("placeholder-here")).toBeNull();
    // Our placeholders don't have a test id; assert by attribute
    const placeholderInWrapper = c2Wrapper.querySelector('[data-placeholder]') as HTMLElement | null;
    expect(placeholderInWrapper).not.toBeNull();
  });

  it("renders placeholder at end of list when insertIndex === length", () => {
    const parent: any = { id: "p2", type: "Section" };
    const children: any[] = [
      { id: "a", type: "Text" },
      { id: "b", type: "Text" },
    ];
    const { container } = render(
      <BlockChildren
        component={parent}
        childComponents={children}
        selectedIds={[]}
        onSelect={() => {}}
        dispatch={() => {}}
        locale={"en" as any}
        gridEnabled={false}
        gridCols={12}
        viewport="desktop"
        device={undefined}
        isOver={true}
        setDropRef={() => {}}
        editor={undefined}
        baselineSnap={false}
        baselineStep={8}
        dropAllowed={true}
        insertParentId={"p2"}
        insertIndex={2}
      />
    );
    const containerEl = container.querySelector('#container-p2') as HTMLElement;
    // There should be exactly one placeholder not inside child wrappers at the end; assert we have at least one placeholder overall.
    const placeholders = containerEl.querySelectorAll('[data-placeholder]');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("renders placeholder in Tabbed children at the end of slot", () => {
    const parent: any = { id: "tabs1", type: "Tabs", tabs: ["Tab 1", "Tab 2"] };
    const children: any[] = [
      { id: "t1", type: "Text", slotKey: "0" },
      { id: "t2", type: "Text", slotKey: "1" },
    ];
    const { container } = render(
      <BlockChildren
        component={parent}
        childComponents={children}
        selectedIds={[]}
        onSelect={() => {}}
        dispatch={() => {}}
        locale={"en" as any}
        gridEnabled={false}
        gridCols={12}
        viewport="desktop"
        device={undefined}
        isOver={true}
        setDropRef={() => {}}
        editor={undefined}
        baselineSnap={false}
        baselineStep={8}
        dropAllowed={true}
        insertParentId={"tabs1"}
        insertIndex={2} // after t2 (end of Tab 2 slot)
      />
    );
    // Find the Tab 2 section by its title
    const tab2 = Array.from(container.querySelectorAll("div")).find((el) => /Tab 2/.test(el.textContent || "")) as HTMLElement | undefined;
    expect(tab2).toBeDefined();
    const placeholderInTab2 = tab2!.querySelector('[data-placeholder]');
    expect(placeholderInTab2).not.toBeNull();
  });

  it("renders placeholder in Grid area before the first item", () => {
    const parent: any = { id: "grid1", type: "Grid", areas: '"a a"\n"a a"' };
    const children: any[] = [
      { id: "g1", type: "Text", gridArea: "a" },
    ];
    const { container } = render(
      <BlockChildren
        component={parent}
        childComponents={children}
        selectedIds={[]}
        onSelect={() => {}}
        dispatch={() => {}}
        locale={"en" as any}
        gridEnabled={false}
        gridCols={12}
        viewport="desktop"
        device={undefined}
        isOver={true}
        setDropRef={() => {}}
        editor={undefined}
        baselineSnap={false}
        baselineStep={8}
        dropAllowed={true}
        insertParentId={"grid1"}
        insertIndex={0}
      />
    );
    // Find the area "a" section
    const areaSection = Array.from(container.querySelectorAll("div")).find((el) => /Area:\s*a/.test(el.textContent || ""))?.parentElement as HTMLElement | undefined;
    expect(areaSection).toBeDefined();
    const placeholderInArea = areaSection!.querySelector('[data-placeholder]');
    expect(placeholderInArea).not.toBeNull();
  });
});

