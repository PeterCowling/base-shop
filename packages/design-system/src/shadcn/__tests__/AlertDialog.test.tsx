import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";

import { AlertDialogAction, AlertDialogCancel } from "../AlertDialog";

describe("AlertDialog shadcn actions", () => {
  it("renders action button with default radius token", () => {
    render(<AlertDialogAction>Confirm</AlertDialogAction>);
    const action = screen.getByRole("button", { name: "Confirm" });
    expect(action).toHaveClass("rounded-md");
  });

  it("supports shape and radius overrides without forwarding DOM attrs", () => {
    render(
      <>
        <AlertDialogAction shape="square" radius="lg">
          Confirm
        </AlertDialogAction>
        <AlertDialogCancel shape="pill">Cancel</AlertDialogCancel>
      </>
    );

    const action = screen.getByRole("button", { name: "Confirm" });
    const cancel = screen.getByRole("button", { name: "Cancel" });

    expect(action).toHaveClass("rounded-lg");
    expect(action).not.toHaveClass("rounded-none");
    expect(action).not.toHaveAttribute("shape");
    expect(action).not.toHaveAttribute("radius");

    expect(cancel).toHaveClass("rounded-full");
    expect(cancel).not.toHaveAttribute("shape");
  });
});
