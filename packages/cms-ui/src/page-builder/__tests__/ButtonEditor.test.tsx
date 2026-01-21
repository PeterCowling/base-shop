import { fireEvent, render, screen } from "@testing-library/react";

import ButtonEditor from "../ButtonEditor";

const handleInput = jest.fn();
jest.mock("../useComponentInputs", () => ({
  __esModule: true,
  default: () => ({ handleInput }),
}));

describe("ButtonEditor", () => {
  it("calls handleInput for label, URL and variant changes", async () => {
    const component: any = { type: "Button", label: "", href: "", variant: "" };
    const onChange = jest.fn();
    render(<ButtonEditor component={component} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "Click" },
    });
    expect(handleInput).toHaveBeenNthCalledWith(1, "label", "Click");

    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "/home" },
    });
    expect(handleInput).toHaveBeenNthCalledWith(2, "href", "/home");

    const combobox = screen.getByRole("combobox");
    fireEvent.click(combobox);
    fireEvent.click(await screen.findByRole("option", { name: "outline" }));
    expect(handleInput).toHaveBeenNthCalledWith(3, "variant", "outline");
    const hiddenInput = document.querySelector("input");
    fireEvent.input(hiddenInput!, { target: { value: "" } });
    expect(handleInput).toHaveBeenNthCalledWith(4, "variant", undefined);
  });
});
