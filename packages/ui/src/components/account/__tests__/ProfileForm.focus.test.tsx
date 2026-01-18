import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "../ProfileForm";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

// Minimal i18n mock so labels resolve to human-readable strings
const translations: Record<string, string> = {
  "fields.name": "Name",
  "fields.email": "Email",
  "forms.validation.name.required": "Name is required",
  "forms.validation.email.required": "Email is required",
  "forms.error.fixBelow": "Please fix errors below",
};
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
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
