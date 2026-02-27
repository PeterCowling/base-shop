import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import StaffAccountsForm from "../StaffAccountsForm";

const mockUseAuth = jest.fn();
const mockGetFirebaseAuth = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockUseFirebaseApp = jest.fn();
const mockFetch = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../../services/firebaseAuth", () => ({
  getFirebaseAuth: (...args: unknown[]) => mockGetFirebaseAuth(...args),
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseApp: () => mockUseFirebaseApp(),
}));

const OWNER_USER = {
  uid: "owner-uid",
  email: "owner@test.com",
  user_name: "owner",
  roles: ["owner"],
};

const STAFF_USER = {
  uid: "staff-uid",
  email: "staff@test.com",
  user_name: "staff",
  roles: ["staff"],
};

/** Mock Firebase auth instance with a currentUser that can getIdToken */
function makeAuthMock(idToken = "mock-id-token") {
  return {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue(idToken),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;

  mockUseAuth.mockReturnValue({ user: OWNER_USER });
  mockUseFirebaseApp.mockReturnValue({ projectId: "test" });
  mockGetFirebaseAuth.mockReturnValue(makeAuthMock());
  mockSendPasswordResetEmail.mockResolvedValue({ success: true });
});

describe("StaffAccountsForm", () => {
  // TC-05-01: Form renders with email, display name, and role picker
  it("renders email, display name, and role picker fields", () => {
    render(<StaffAccountsForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  // TC-05-02: Role picker options are staff/manager/admin only
  it("role picker has exactly staff, manager, and admin options", () => {
    render(<StaffAccountsForm />);

    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);

    expect(options).toEqual(["staff", "manager", "admin"]);
  });

  // TC-05-03: Submit calls POST /api/users/provision with body (no idToken field)
  it("submits POST to /api/users/provision without idToken in body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, uid: "new-uid", email: "test@example.com" }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/display name/i), "Test User");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    const [url, options] = mockFetch.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string>; body: string },
    ];
    expect(url).toBe("/api/users/provision");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body) as Record<string, unknown>;
    expect(body.email).toBe("test@example.com");
    expect(body.displayName).toBe("Test User");
    expect(body.role).toBe("staff");
    expect(body).not.toHaveProperty("idToken");
    expect(options.headers["Authorization"]).toMatch(/^Bearer /);
  });

  // TC-05-04: On 200 success, success message and "Resend setup email" button
  it("shows success message and resend button after successful creation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        uid: "new-uid",
        email: "test@example.com",
      }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /resend setup email/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
  });

  // TC-05-05: Clicking "Resend setup email" calls sendPasswordResetEmail
  it("calls sendPasswordResetEmail when resend button is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        uid: "new-uid",
        email: "test@example.com",
      }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      screen.getByRole("button", { name: /resend setup email/i }),
    );

    await user.click(screen.getByRole("button", { name: /resend setup email/i }));

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
    );
  });

  // TC-05-06: On 403 response, "Insufficient permissions" error
  it("shows insufficient permissions error on 403", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: "Insufficient permissions" }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/insufficient permissions/i),
      ).toBeInTheDocument(),
    );
  });

  // TC-05-07: On 400 response, validation error message
  it("shows validation error on 400", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, error: "email is required" }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/email is required/i)).toBeInTheDocument(),
    );
  });

  // TC-05-08: On 409 response, "An account with this email already exists"
  it("shows already-exists error on 409", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: "An account with this email already exists",
      }),
    });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/an account with this email already exists/i),
      ).toBeInTheDocument(),
    );
  });

  // TC-05-09: Staff-role users see null (form not rendered)
  it("renders nothing for staff-role users", () => {
    mockUseAuth.mockReturnValue({ user: STAFF_USER });

    const { container } = render(<StaffAccountsForm />);

    expect(container).toBeEmptyDOMElement();
  });
});
