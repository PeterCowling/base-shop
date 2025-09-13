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
    const { getByText, findByLabelText } = render(
      <PageSidebar
        components={[component]}
        selectedId={component.id}
        dispatch={dispatch}
      />
    );

    // onResize
    fireEvent.click(getByText("Layout"));
    fireEvent.change(await findByLabelText("Width (Desktop)", { exact: false }), {
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

    // duplicate
    fireEvent.click(getByText("Duplicate"));
    expect(dispatch).toHaveBeenCalledWith({ type: "duplicate", id: component.id });
  });
});
