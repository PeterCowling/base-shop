import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountPanel } from "./AccountPanel";

jest.mock("next/image", () => (props: any) => <img {...props} />);

describe("AccountPanel", () => {
  it("toggles visibility via user interaction", async () => {
    const user = userEvent.setup();
    const Wrapper = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen((v) => !v)}>toggle</button>
          {open && (
            <AccountPanel
              user={{ name: "Alice", email: "alice@example.com" }}
            />
          )}
        </>
      );
    };

    render(<Wrapper />);

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle/i }));
    expect(screen.getByText("Alice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle/i }));
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });
});
