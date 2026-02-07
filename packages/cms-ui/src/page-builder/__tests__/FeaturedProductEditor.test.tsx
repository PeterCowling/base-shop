import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import FeaturedProductEditor from "../FeaturedProductEditor";

describe("FeaturedProductEditor", () => {
  it("updates sku and collectionId separately", () => {
    const onChange = jest.fn();
    render(
      <FeaturedProductEditor
        component={{ type: "FeaturedProduct", sku: "", collectionId: "" }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("sku"), {
      target: { value: "sku1" },
    });
    expect(onChange).toHaveBeenNthCalledWith(1, { sku: "sku1" });

    fireEvent.change(screen.getByPlaceholderText("collectionId"), {
      target: { value: "col1" },
    });
    expect(onChange).toHaveBeenNthCalledWith(2, { collectionId: "col1" });
  });
});

