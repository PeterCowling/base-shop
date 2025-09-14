import "@testing-library/jest-dom";
import React from "react";
import { render } from "@testing-library/react";

const updateProduct = jest.fn();
jest.mock("@cms/actions/products.server", () => ({ updateProduct }));
let receivedProps: any;
jest.mock("@ui/components/cms/ProductEditorForm", () => (props: any) => {
  receivedProps = props;
  return <div data-testid="form" />;
});

import ProductEditor from "../src/app/cms/shop/[shop]/products/[id]/edit/ProductEditor.client";

describe("ProductEditor client", () => {
  it("renders form and calls update on save", () => {
    const product = { id: "p1" } as any;
    render(
      <ProductEditor shop="s1" initialProduct={product} languages={["en"]} />,
    );
    expect(receivedProps.product.variants).toEqual({});
    const fd = new FormData();
    receivedProps.onSave(fd);
    expect(updateProduct).toHaveBeenCalledWith("s1", fd);
  });
});
