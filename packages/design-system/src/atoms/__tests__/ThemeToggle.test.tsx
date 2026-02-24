import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "../ThemeToggle";

describe("ThemeToggle", () => {
  it("calls onThemeChange when selecting another option", async () => {
    const onThemeChange = jest.fn();
    render(<ThemeToggle theme="base" onThemeChange={onThemeChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("supports container and item shape/radius overrides", () => {
    const { container } = render(
      <ThemeToggle
        theme="base"
        onThemeChange={() => {}}
        shape="square"
        itemShape="square"
      />,
    );

    const group = container.querySelector("[role='radiogroup']");
    const lightButton = screen.getByRole("radio", { name: "Light" });

    expect(group).toHaveClass("rounded-none");
    expect(lightButton).toHaveClass("rounded-none");
  });
});
