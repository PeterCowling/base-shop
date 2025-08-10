import { render, fireEvent } from "@testing-library/react";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@types";

describe("ComponentEditor", () => {
  it("updates width and height", () => {
    const component: PageComponent = {
      id: "1",
      type: "Image",
    } as PageComponent;
    const onResize = jest.fn();
    const { getByLabelText, getByText } = render(
      <ComponentEditor
        component={component}
        onChange={() => {}}
        onResize={onResize}
      />
    );
    fireEvent.change(getByLabelText("Width"), { target: { value: "200" } });
    expect(onResize).toHaveBeenCalledWith({ width: "200" });
    fireEvent.click(getByText("Full width"));
    expect(onResize).toHaveBeenCalledWith({ width: "100%" });
    fireEvent.change(getByLabelText("Height"), { target: { value: "300" } });
    expect(onResize).toHaveBeenCalledWith({ height: "300" });
    fireEvent.click(getByText("Full height"));
    expect(onResize).toHaveBeenCalledWith({ height: "100%" });
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
