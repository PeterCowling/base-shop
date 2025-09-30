import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getCsrfToken } from "@acme/shared-utils";
import ProfileForm from "../ProfileForm";

jest.mock("@acme/shared-utils", () => ({
  __esModule: true,
  getCsrfToken: jest.fn(() => "csrf-token"),
}));

describe("ProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // @ts-expect-error — cleanup for tests that mock fetch
    delete global.fetch;
  });

  it("shows validation errors when fields are empty", async () => {
    render(<ProfileForm />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Please fix the errors below.")).toBeInTheDocument();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
  });

  it("clears individual field errors when the user edits inputs", async () => {
    render(<ProfileForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/name/i), "Taylor");

    expect(screen.queryByText("Name is required.")).not.toBeInTheDocument();
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

  it("falls back to default copy when conflict response omits a message", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({}),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    const conflictMessage = await screen.findAllByText("Email already in use");
    expect(conflictMessage).toHaveLength(2);
  });

  it("uses the update failed fallback when the server omits an error", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("Update failed")).toBeInTheDocument();
  });

  it("shows an unexpected error message when the request rejects", async () => {
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText("An unexpected error occurred.")
    ).toBeInTheDocument();
  });

  it("sends an empty CSRF header when the token is unavailable", async () => {
    (getCsrfToken as jest.Mock).mockReturnValueOnce(undefined);
    const response = { ok: true, status: 200, json: async () => ({}) };
    // @ts-expect-error — mocking global.fetch in tests
    global.fetch = jest.fn().mockResolvedValue(response);

    render(<ProfileForm name="Jane" email="jane@example.com" />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/account/profile",
      expect.objectContaining({
        headers: expect.objectContaining({ "x-csrf-token": "" }),
      })
    );
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
