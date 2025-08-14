import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { useComponentResize } from "../src/components/cms/page-builder/useComponentResize";

describe("useComponentResize", () => {
  function Wrapper({ component, onResize }: any) {
    const { viewportControls, absoluteControls } = useComponentResize(
      component,
      onResize,
    );
    return (
      <div>
        {viewportControls}
        {absoluteControls}
      </div>
    );
  }

  it("triggers onResize for width inputs and buttons", () => {
    const onResize = jest.fn();
    const component: any = { id: "1", type: "Image", position: "absolute" };
    const { getByLabelText, getAllByText } = render(
      <Wrapper component={component} onResize={onResize} />,
    );
    fireEvent.change(getByLabelText("Width (Desktop)"), {
      target: { value: "200" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200" });
    fireEvent.click(getAllByText("Full width")[0]);
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
    fireEvent.change(getByLabelText("Top"), { target: { value: "10px" } });
    expect(onResize).toHaveBeenCalledWith({ top: "10px" });
  });
});

