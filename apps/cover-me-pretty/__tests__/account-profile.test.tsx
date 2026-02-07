// apps/cover-me-pretty/__tests__/account-profile.test.tsx
jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import { getCustomerSession } from "@acme/auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import { render, screen } from "@testing-library/react";
import { ProfilePage } from "@acme/ui/account";
import { redirect } from "next/navigation";

describe("/account/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    await ProfilePage({});
    expect(getCustomerSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Fprofile",
    );
    expect(getCustomerProfile).not.toHaveBeenCalled();
  });

  it("renders profile form for authenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    (getCustomerProfile as jest.Mock).mockResolvedValue({
      name: "Jane Doe",
      email: "jane@example.com",
    });
    const element = await ProfilePage({});
    expect(getCustomerSession).toHaveBeenCalled();
    expect(getCustomerProfile).toHaveBeenCalledWith("cust1");
    expect(redirect).not.toHaveBeenCalled();
    render(element);
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com");
  });

  it("redirects when session token expired", async () => {
    jest.useFakeTimers();
    const start = new Date("2023-01-01T00:00:00Z");
    jest.setSystemTime(start);
    (getCustomerSession as jest.Mock).mockImplementation(async () => {
      return Date.now() - start.getTime() > 1000
        ? null
        : { customerId: "cust1" };
    });
    (getCustomerProfile as jest.Mock).mockResolvedValue({
      name: "Jane Doe",
      email: "jane@example.com",
    });

    await ProfilePage({});
    expect(redirect).not.toHaveBeenCalled();

    jest.setSystemTime(new Date(start.getTime() + 2000));
    await ProfilePage({});
    expect(redirect).toHaveBeenCalledWith(
      "/login?callbackUrl=%2Faccount%2Fprofile",
    );
    jest.useRealTimers();
  });
});
