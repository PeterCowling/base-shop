import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "../ProfileForm";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

describe("ProfileForm focus behavior", () => {
  it("focuses first invalid field on client-side validation", async () => {
    render(<ProfileForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save/i }));
    const name = screen.getByLabelText("Name");
    expect(name).toHaveFocus();
  });

  it("focuses email on 409 conflict error", async () => {
    // @ts-expect-error
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Email already in use" }),
    });
    render(<ProfileForm name="Jane" email="jane@example.com" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save/i }));
    const email = await screen.findByLabelText("Email");
    expect(email).toHaveFocus();
  });
});

