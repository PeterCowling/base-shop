import { fireEvent, render, screen } from "@testing-library/react";
import ComponentEditor from "../ComponentEditor";

describe("ComponentEditor", () => {
  it("propagates field changes and resizes", async () => {
    const component: any = {
      type: "Button",
      label: "",
      widthDesktop: "",
    };
    const onChange = jest.fn();
    const onResize = jest.fn();

    render(
      <ComponentEditor
        component={component}
        onChange={onChange}
        onResize={onResize}
      />
    );

    // Update content via the specific editor
    fireEvent.click(screen.getByRole("button", { name: /Content/ }));
    const input = await screen.findByLabelText("Label");
    fireEvent.change(input, { target: { value: "Click" } });
    expect(onChange).toHaveBeenCalledWith({ label: "Click" });

    // Update a layout field
    fireEvent.click(screen.getByRole("button", { name: /Layout/ }));
    fireEvent.change(screen.getByLabelText(/Width \(Desktop\)/), {
      target: { value: "100px" },
    });
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100px" });
  });
});

