import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Login from "../../components/Login";

const loginMock = jest.fn();
const readJsonMock = jest.fn();

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    login: (...args: unknown[]) => loginMock(...args),
    status: "idle",
  }),
}));

jest.mock("../../providers/ReceptionThemeProvider", () => ({
  useReceptionTheme: () => ({}),
}));

jest.mock("../../services/useFirebase", () => ({
  useFirebaseApp: () => ({ projectId: "test" }),
}));

jest.mock("../../services/firebaseAuth", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("../../lib/offline/storage", () => ({
  readJson: (...args: unknown[]) => readJsonMock(...args),
  removeItem: jest.fn(),
  writeJson: jest.fn(),
}));

describe("/bar unauthenticated login parity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loginMock.mockResolvedValue({ success: true });
    readJsonMock.mockReturnValue(null);
  });

  it("matches baseline login selectors and DOM snapshot", () => {
    const { container } = render(<Login />);

    expect(
      screen.getByRole("button", { name: /^sign in$/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it("preserves input arrow-key behavior and toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    await user.type(emailInput, "agent@example.com");
    emailInput.focus();

    await user.keyboard("{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}");
    expect(emailInput).toHaveValue("agent@example.com");

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const visibilityToggle = screen.getByRole("button", {
      name: /show password/i,
    });

    await user.click(visibilityToggle);

    expect(passwordInput.type).toBe("text");
    expect(
      screen.getByRole("button", { name: /hide password/i }),
    ).toBeInTheDocument();
  });
});
