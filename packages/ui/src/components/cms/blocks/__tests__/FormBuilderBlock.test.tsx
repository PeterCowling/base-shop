import { render, screen } from "@testing-library/react";
import FormBuilderBlock from "../FormBuilderBlock";

describe("FormBuilderBlock", () => {
  it("renders configured fields", () => {
    render(
      <FormBuilderBlock
        fields={[
          { type: "text", name: "name", label: "Name" },
          { type: "email", name: "email", label: "Email" },
          {
            type: "select",
            name: "color",
            label: "Favorite Color",
            options: [
              { label: "Red", value: "red" },
              { label: "Blue", value: "blue" },
            ],
          },
        ]}
      />
    );

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Favorite Color")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Red" })).toBeInTheDocument();
  });
});

