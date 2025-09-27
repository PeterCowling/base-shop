/* i18n-exempt file -- tests use literals for clarity */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountPanel } from "../AccountPanel";
import "../../../../../../test/resetNextMocks";

describe("AccountPanel", () => {
  it("renders user info and logout button", async () => {
    const handleLogout = jest.fn();
    render(
      <AccountPanel
        user={{ name: "Alice", email: "alice@example.com" }}
        onLogout={handleLogout}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(handleLogout).toHaveBeenCalled();
  });

  it("shows avatar when provided", () => {
    render(
      <AccountPanel
        user={{
          name: "Bob",
          email: "bob@example.com",
          avatar: "/bob.png",
        }}
      />
    );

    expect(screen.getByAltText("Bob")).toBeInTheDocument();
  });
});
