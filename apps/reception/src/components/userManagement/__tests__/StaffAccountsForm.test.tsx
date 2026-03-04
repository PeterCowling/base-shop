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

const PETE_USER = {
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

const originalPeteEmails = process.env.RECEPTION_STAFF_ACCOUNTS_PETE_EMAILS;

function makeAuthMock(idToken = "mock-id-token") {
  return {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue(idToken),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.RECEPTION_STAFF_ACCOUNTS_PETE_EMAILS = "owner@test.com";

  global.fetch = mockFetch as unknown as typeof fetch;
  mockUseAuth.mockReturnValue({ user: PETE_USER });
  mockUseFirebaseApp.mockReturnValue({ projectId: "test" });
  mockGetFirebaseAuth.mockReturnValue(makeAuthMock());
  mockSendPasswordResetEmail.mockResolvedValue({ success: true });

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, accounts: [] }),
  });
});

afterAll(() => {
  process.env.RECEPTION_STAFF_ACCOUNTS_PETE_EMAILS = originalPeteEmails;
});

describe("StaffAccountsForm", () => {
  it("renders add-account fields and managed permission checkboxes", async () => {
    render(<StaffAccountsForm />);

    await waitFor(() =>
      expect(screen.getByText(/manage existing accounts/i)).toBeInTheDocument(),
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/staff/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/manager/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/admin/i)[0]).toBeInTheDocument();
  });

  it("submits POST to /api/users/provision with roles array", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, accounts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, uid: "new-uid", email: "test@example.com" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, accounts: [] }),
      });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/display name/i), "Test User");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /resend setup email/i }),
      ).toBeInTheDocument(),
    );

    const postCall = mockFetch.mock.calls.find(
      (call) => (call[1] as { method?: string })?.method === "POST",
    ) as [string, { method: string; headers: Record<string, string>; body: string }] | undefined;

    expect(postCall).toBeDefined();
    expect(postCall?.[0]).toBe("/api/users/provision");

    const body = JSON.parse(postCall?.[1].body ?? "{}") as Record<string, unknown>;
    expect(body.email).toBe("test@example.com");
    expect(body.displayName).toBe("Test User");
    expect(body.roles).toEqual(["staff"]);
    expect(postCall?.[1].headers["Authorization"]).toMatch(/^Bearer /);
  });

  it("calls sendPasswordResetEmail when resend button is clicked", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, accounts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, uid: "new-uid", email: "test@example.com" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, accounts: [] }),
      });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

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

  it("shows server error on failed creation", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, accounts: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ success: false, error: "Insufficient permissions" }),
      });

    const user = userEvent.setup();
    render(<StaffAccountsForm />);

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/insufficient permissions/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows access restriction for non-pete users", () => {
    mockUseAuth.mockReturnValue({ user: STAFF_USER });
    render(<StaffAccountsForm />);

    expect(
      screen.getByText(/requires owner\/developer permissions/i),
    ).toBeInTheDocument();
  });
});
