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
            name: "plan",
            label: "Plan",
            options: ["Free", "Pro"],
          },
        ]}
      />
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    const select = screen.getByLabelText("Plan");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Free" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit/i })
    ).toBeInTheDocument();
  });
});
