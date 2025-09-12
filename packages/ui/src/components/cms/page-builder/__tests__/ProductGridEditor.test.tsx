import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ProductGridEditor from "../ProductGridEditor";

describe("ProductGridEditor", () => {
  function setup() {
    const initial: any = {
      type: "ProductGrid",
      mode: "collection",
      quickView: false,
      collectionId: "",
      skus: [],
    };
    const onChange = jest.fn();

    const Wrapper = () => {
      const [component, setComponent] = React.useState(initial);
      const handleChange = (patch: any) => {
        onChange(patch);
        setComponent((c: any) => ({ ...c, ...patch }));
      };
      return <ProductGridEditor component={component} onChange={handleChange} />;
    };

    render(<Wrapper />);
    return { onChange };
  }

  it("toggles quick view and calls onChange with correct values", () => {
    const { onChange } = setup();

    const checkbox = screen.getByLabelText("Enable Quick View");

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenNthCalledWith(1, { quickView: true });

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenNthCalledWith(2, { quickView: undefined });
  });

  it("switches between collection and manual modes and parses skus", async () => {
    const { onChange } = setup();

    // initially collection input is visible
    expect(screen.getByLabelText("Collection ID")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("SKUs (comma separated)")
    ).not.toBeInTheDocument();

    // switch to manual mode
    fireEvent.click(screen.getByRole("combobox"));
    const manualOption = await screen.findByRole("option", {
      name: "Manual SKUs",
    });
    fireEvent.click(manualOption);
    expect(onChange).toHaveBeenNthCalledWith(1, { mode: "manual" });
    expect(screen.getByLabelText("SKUs (comma separated)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Collection ID")).not.toBeInTheDocument();

    // enter and parse skus
    const skuField = screen.getByLabelText("SKUs (comma separated)");
    fireEvent.change(skuField, { target: { value: "sku1, sku2\n sku3" } });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      skus: ["sku1", "sku2", "sku3"],
    });

    // switch back to collection mode
    fireEvent.click(screen.getByRole("combobox"));
    const collectionOption = await screen.findByRole("option", {
      name: "Collection",
    });
    fireEvent.click(collectionOption);
    expect(onChange).toHaveBeenNthCalledWith(3, { mode: "collection" });
    expect(screen.getByLabelText("Collection ID")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("SKUs (comma separated)")
    ).not.toBeInTheDocument();
  });
});

