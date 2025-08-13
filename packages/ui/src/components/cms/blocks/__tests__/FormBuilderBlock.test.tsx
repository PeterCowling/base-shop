import { render, screen } from "@testing-library/react";
import FormBuilderBlock from "../FormBuilderBlock";

describe("FormBuilderBlock", () => {
  it("renders configured fields", () => {
    render(
      <FormBuilderBlock
        fields={[
          { type: "text", name: "name", placeholder: "Name" },
          { type: "email", name: "email", placeholder: "Email" },
          {
            type: "select",
            name: "color",
            options: [
              { label: "Red", value: "red" },
              { label: "Blue", value: "blue" },
            ],
          },
        ]}
      />
    );
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Red" })).toBeInTheDocument();
  });
});
