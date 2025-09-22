import React from "react";
import { render } from "@testing-library/react";
import EditableCanvas from "../src/components/cms/page-builder/EditableCanvas";
import BlockChildren from "../src/components/cms/page-builder/BlockChildren";

describe("Invalid drop styling", () => {
  it("canvas shows danger ring when invalid", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
    const { container } = render(
      <EditableCanvas
        components={[] as any}
        selectedIds={[]}
        onSelectIds={() => {}}
        canvasRef={ref}
        dragOver={true}
        setDragOver={() => {}}
        onFileDrop={() => {}}
        insertIndex={0}
        insertParentId={undefined}
        dispatch={() => {}}
        locale={"en" as any}
        containerStyle={{}}
        showGrid={false}
        gridCols={12}
        showRulers={false}
        viewport="desktop"
        snapPosition={null}
        zoom={1}
        showBaseline={false}
        baselineStep={8}
        dropAllowed={false}
      />
    );
    const canvas = container.querySelector("#canvas") as HTMLElement;
    expect(canvas.className).toMatch(/ring-danger/);
  });

  it("container shows danger styles when invalid and over", () => {
    const comp: any = { id: "p1", type: "Section", children: [{ id: "c1", type: "Text" }] };
    const { container } = render(
      <BlockChildren
        component={comp}
        childComponents={comp.children}
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
        dropAllowed={false}
        // index 0 placeholder
        insertParentId={"p1"}
        insertIndex={0}
      />
    );
    const containerEl = container.querySelector("#container-p1") as HTMLElement;
    expect(containerEl.className).toMatch(/ring-danger/);
  });
});
