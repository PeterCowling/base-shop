/**
 * UserSwitcher Component Tests
 * BOS-P2-01
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { USERS } from "@/lib/current-user";

import { UserSwitcher } from "./UserSwitcher";

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

// Mock Cookies.set
jest.mock("js-cookie", () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

describe("UserSwitcher", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockReload.mockClear();
    jest.clearAllMocks();
  });

  it("renders current user name", () => {
    render(<UserSwitcher currentUser={USERS.pete} />);

    expect(screen.getByText("Pete")).toBeInTheDocument();
  });

  it("shows dropdown when clicked", async () => {
    render(<UserSwitcher currentUser={USERS.pete} />);

    const button = screen.getByRole("button", { name: /pete/i });
    await user.click(button);

    // All users should be visible in dropdown
    expect(screen.getByRole("option", { name: /pete/i })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /cristiana/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /avery/i })).toBeInTheDocument();
  });

  it("switches user when option selected", async () => {
    const Cookies = require("js-cookie");

    render(<UserSwitcher currentUser={USERS.pete} />);

    const button = screen.getByRole("button", { name: /pete/i });
    await user.click(button);

    const cristianaOption = screen.getByRole("option", { name: /cristiana/i });
    await user.click(cristianaOption);

    // Should set cookie and reload
    expect(Cookies.set).toHaveBeenCalledWith(
      "current_user_id",
      "cristiana",
      expect.any(Object),
    );
    expect(mockReload).toHaveBeenCalled();
  });

  it("does not reload when selecting current user", async () => {
    render(<UserSwitcher currentUser={USERS.pete} />);

    const button = screen.getByRole("button", { name: /pete/i });
    await user.click(button);

    const peteOption = screen.getByRole("option", { name: /pete/i });
    await user.click(peteOption);

    // Should not reload if already on Pete
    expect(mockReload).not.toHaveBeenCalled();
  });

  it("shows admin badge for admin users", () => {
    render(<UserSwitcher currentUser={USERS.cristiana} />);

    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it("does not show admin badge for regular users", () => {
    render(<UserSwitcher currentUser={USERS.avery} />);

    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  it("is hidden in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const { container } = render(<UserSwitcher currentUser={USERS.pete} />);

    expect(container.firstChild).toBeNull();

    process.env.NODE_ENV = originalEnv;
  });
});
