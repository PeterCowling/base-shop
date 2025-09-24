import { render, fireEvent } from "@testing-library/react";
import type { PageComponent } from "@acme/types";
import PageSidebar from "../src/components/cms/page-builder/PageSidebar";

describe("PageSidebar", () => {
  it("dispatches correct actions for edits and duplication", async () => {
    const component: PageComponent = {
      id: "c1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const dispatch = jest.fn();
    const { getByText, findByLabelText, container } = render(
      <PageSidebar
        components={[component]}
        selectedIds={[component.id]}
        onSelectIds={() => {}}
        dispatch={dispatch}
      />
    );

    // onResize
    const widthInput = await findByLabelText(/W\s*\(Width\)/i);
    fireEvent.change(widthInput, {
      target: { value: "200" },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "resize",
      id: component.id,
      widthDesktop: "200",
    });
    dispatch.mockClear();

    // onChange
    fireEvent.click(getByText("Content"));
    fireEvent.change(await findByLabelText("Min Items", { exact: false }), {
      target: { value: "2" },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      id: component.id,
      patch: { minItems: 2 },
    });
    dispatch.mockClear();

    // duplicate (click the enabled Duplicate button for component, not the preset one)
    const dupButtons = Array.from(container.querySelectorAll('button'))
      .filter((b) => b.textContent?.trim() === 'Duplicate' && !(b as HTMLButtonElement).disabled);
    expect(dupButtons.length).toBeGreaterThan(0);
    fireEvent.click(dupButtons[0] as HTMLButtonElement);
    expect(dispatch).toHaveBeenCalledWith({ type: "duplicate", id: component.id });
  });
});
