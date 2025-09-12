import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SideNav } from "./SideNav";

function TestNav() {
  const [active, setActive] = React.useState("home");
  return (
    <SideNav>
      <a
        href="#home"
        data-testid="home"
        className={active === "home" ? "text-blue-500" : ""}
        onClick={() => setActive("home")}
      >
        Home
      </a>
      <a
        href="#settings"
        data-testid="settings"
        className={active === "settings" ? "text-blue-500" : ""}
        onClick={() => setActive("settings")}
      >
        Settings
      </a>
    </SideNav>
  );
}

describe("SideNav interactions", () => {
  it("highlights the active link when toggled", async () => {
    const user = userEvent.setup();
    render(<TestNav />);
    const home = screen.getByTestId("home");
    const settings = screen.getByTestId("settings");

    expect(home).toHaveClass("text-blue-500");
    expect(settings).not.toHaveClass("text-blue-500");

    await user.click(settings);

    expect(settings).toHaveClass("text-blue-500");
    expect(home).not.toHaveClass("text-blue-500");
  });
});
