import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "../ProfileForm";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation errors when fields are empty", async () => {
    render(<ProfileForm />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Please fix the errors below.")).toBeInTheDocument();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
  });

  it("displays conflict error on 409 response", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Email already in use" }),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findAllByText("Email already in use")).toHaveLength(2);
  });

  it("displays field errors on 400 response", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ email: ["Invalid email"] }),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Please fix the errors below.")).toBeInTheDocument();
    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
  });

  it("displays generic error on 500 response", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  it("shows success message on 200 response", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText("Profile updated successfully.")
    ).toBeInTheDocument();
  });
});
