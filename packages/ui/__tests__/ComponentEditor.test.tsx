import { render, fireEvent } from "@testing-library/react";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@acme/types";

describe("ComponentEditor", () => {
  it("updates width and height", () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const onResize = jest.fn();
    const { getByLabelText, getAllByText } = render(
      <ComponentEditor
        component={component}
        onChange={() => {}}
        onResize={onResize}
      />
    );
    fireEvent.change(getByLabelText("Width (Desktop)"), {
      target: { value: "200" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200" });
    fireEvent.click(getAllByText("Full width")[0]);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
    fireEvent.change(getByLabelText("Height (Desktop)"), {
      target: { value: "300" },
    });
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "300" });
    fireEvent.click(getAllByText("Full height")[0]);
    expect(onResize).toHaveBeenCalledWith({ heightDesktop: "100%" });
  });

  it("updates minItems and maxItems", () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
    );
    fireEvent.change(getByLabelText("Min Items"), { target: { value: "2" } });
    fireEvent.change(getByLabelText("Max Items"), { target: { value: "6" } });
    expect(onChange).toHaveBeenCalledWith({ minItems: 2 });
    expect(onChange).toHaveBeenCalledWith({ maxItems: 6 });
  });

  it("clamps minItems and maxItems against each other", () => {
    const component: PageComponent = {
      id: "1",
      type: "ProductCarousel",
      minItems: 1,
      maxItems: 5,
    } as PageComponent;
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
    );
    fireEvent.change(getByLabelText("Min Items"), { target: { value: "6" } });
    expect(onChange).toHaveBeenNthCalledWith(1, { minItems: 6, maxItems: 6 });
    fireEvent.change(getByLabelText("Max Items"), { target: { value: "0" } });
    expect(onChange).toHaveBeenNthCalledWith(2, { maxItems: 0, minItems: 0 });
  });
});
