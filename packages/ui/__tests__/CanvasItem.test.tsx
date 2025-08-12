import { render } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import CanvasItem from "../src/components/cms/page-builder/CanvasItem";

describe("CanvasItem", () => {
  it("sanitizes HTML before rendering", () => {
    const component: any = {
      id: "1",
      type: "Text",
      text: "<p>Hello</p><script>window.evil()</script>",
    };

    const { container } = render(
      <DndContext>
        <SortableContext items={[component.id]}>
          <CanvasItem
            component={component}
            index={0}
            parentId={undefined}
            selectedId={null}
            onSelectId={() => {}}
            onRemove={() => {}}
            dispatch={() => {}}
            locale="en"
            gridEnabled={false}
            gridCols={12}
          />
        </SortableContext>
      </DndContext>
    );

    expect(container.querySelector("script")).toBeNull();
  });
});
