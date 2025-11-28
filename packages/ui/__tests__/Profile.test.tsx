// packages/ui/__tests__/Profile.test.tsx
import { render, screen } from "@testing-library/react";
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@acme/platform-core/customerProfiles", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
}));

import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import ProfilePage from "../src/components/account/Profile";

describe("ProfilePage permissions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("hides change password link without permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "viewer",
    });
    (hasPermission as jest.Mock).mockReturnValue(false);
    (getCustomerProfile as jest.Mock).mockResolvedValue({ name: "Jane" });
    const element = await ProfilePage({});
    render(element);
    expect(hasPermission).toHaveBeenCalledWith("viewer", "manage_profile");
    expect(
      screen.queryByRole("link", { name: /change password/i }),
    ).not.toBeInTheDocument();
  });

  it("shows change password link with permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getCustomerProfile as jest.Mock).mockResolvedValue({ name: "Jane" });
    const element = await ProfilePage({});
    render(element);
    expect(
      screen.getByRole("link", { name: /change password/i }),
    ).toHaveAttribute("href", "/account/change-password");
  });
});
