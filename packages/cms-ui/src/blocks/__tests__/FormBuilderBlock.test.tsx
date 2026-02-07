import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FormBuilderBlock from "../FormBuilderBlock";

describe("FormBuilderBlock", () => {
  const fields = [
    { type: "text", name: "name", label: "Name" },
    {
      type: "select",
      name: "color",
      label: "Color",
      options: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
      ],
    },
  ];

  it("renders configured fields", () => {
    render(<FormBuilderBlock fields={fields} />);
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Red" })).toBeInTheDocument();
  });

  it("collects submitted values", async () => {
    const { container } = render(<FormBuilderBlock fields={fields} />);
    const form = container.querySelector("form")!;
    let submitted: Record<string, FormDataEntryValue> = {};
    const handleSubmit = jest.fn((e: Event) => {
      e.preventDefault();
      const data = new FormData(e.target as HTMLFormElement);
      submitted = Object.fromEntries(data.entries());
    });
    form.addEventListener("submit", handleSubmit);

    await userEvent.type(screen.getByPlaceholderText("Name"), "Alice");
    await userEvent.selectOptions(screen.getByRole("combobox"), "blue");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(handleSubmit).toHaveBeenCalled();
    expect(submitted).toEqual({ name: "Alice", color: "blue" });
  });
});
