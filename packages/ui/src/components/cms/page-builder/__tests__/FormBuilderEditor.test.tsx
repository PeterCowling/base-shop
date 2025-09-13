import { fireEvent, render, screen } from "@testing-library/react";
import FormBuilderEditor from "../FormBuilderEditor";
import type { FormField } from "@acme/types";
import React from "react";

describe("FormBuilderEditor", () => {
  it("addField adds a default field", () => {
    const onChange = jest.fn();
    render(
      <FormBuilderEditor
        component={{ type: "FormBuilderBlock", fields: [] }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add field/i }));

    expect(onChange).toHaveBeenCalledWith({
      fields: [{ type: "text", name: "", label: "" }],
    });
  });

  it("removeField deletes the target field", () => {
    const onChange = jest.fn();
    const fields: FormField[] = [
      { type: "text", name: "a", label: "A" },
      { type: "text", name: "b", label: "B" },
    ];

    render(
      <FormBuilderEditor
        component={{ type: "FormBuilderBlock", fields }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);

    expect(onChange).toHaveBeenCalledWith({ fields: [fields[1]] });
  });

  it("updateField modifies name, label, type, and select options", () => {
    const onChange = jest.fn();

    function Wrapper() {
      const [component, setComponent] = React.useState({
        type: "FormBuilderBlock" as const,
        fields: [{ type: "text", name: "", label: "" }],
      });
      return (
        <FormBuilderEditor
          component={component}
          onChange={(patch) => {
            onChange(patch);
            setComponent((c) => ({ ...c, ...patch }));
          }}
        />
      );
    }

    render(<Wrapper />);

    fireEvent.change(screen.getByPlaceholderText("name"), {
      target: { value: "foo" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      fields: [{ type: "text", name: "foo", label: "" }],
    });

    fireEvent.change(screen.getByPlaceholderText("label"), {
      target: { value: "Foo Label" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      fields: [{ type: "text", name: "foo", label: "Foo Label" }],
    });

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("select"));
    expect(onChange).toHaveBeenLastCalledWith({
      fields: [{ type: "select", name: "foo", label: "Foo Label" }],
    });

    fireEvent.change(
      screen.getByPlaceholderText("options (comma separated)"),
      { target: { value: "a,b" } }
    );
    expect(onChange).toHaveBeenLastCalledWith({
      fields: [
        {
          type: "select",
          name: "foo",
          label: "Foo Label",
          options: [
            { label: "a", value: "a" },
            { label: "b", value: "b" },
          ],
        },
      ],
    });

    fireEvent.change(
      screen.getByPlaceholderText("options (comma separated)"),
      { target: { value: " a, b , ,c,, " } }
    );
    expect(onChange).toHaveBeenLastCalledWith({
      fields: [
        {
          type: "select",
          name: "foo",
          label: "Foo Label",
          options: [
            { label: "a", value: "a" },
            { label: "b", value: "b" },
            { label: "c", value: "c" },
          ],
        },
      ],
    });
  });
});
