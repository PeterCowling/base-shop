import { render, fireEvent } from "@testing-library/react";
import ComponentEditor from "../src/components/cms/page-builder/ComponentEditor";
import type { PageComponent } from "@acme/types";

describe("ComponentEditor", () => {
  it("updates width, height, margin and padding", () => {
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
    fireEvent.change(getByLabelText("Margin (Desktop)"), {
      target: { value: "10px" },
    });
    expect(onResize).toHaveBeenCalledWith({ marginDesktop: "10px" });
    fireEvent.change(getByLabelText("Padding (Desktop)"), {
      target: { value: "5px" },
    });
    expect(onResize).toHaveBeenCalledWith({ paddingDesktop: "5px" });
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

  it("allows adding hotspots for Lookbook", () => {
    const component: PageComponent = {
      id: "1",
      type: "Lookbook",
      src: "image.jpg",
      hotspots: [],
      minItems: 0,
      maxItems: 5,
    } as any;
    const onChange = jest.fn();
    const { getByText } = render(
      <ComponentEditor component={component} onChange={onChange} onResize={() => {}} />
    );
    fireEvent.click(getByText("Add hotspot"));
    expect(onChange).toHaveBeenCalledWith({
      hotspots: [{ x: 50, y: 50, sku: "" }],
    });
  });
});
