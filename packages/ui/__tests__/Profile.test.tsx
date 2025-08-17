// packages/ui/__tests__/Profile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@platform-core", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
}));

import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@platform-core";
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
    expect(hasPermission).toHaveBeenCalledWith("viewer", "manage_profile");
    expect(element.props.children[2]).toBeFalsy();
  });

  it("shows change password link with permission", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
      role: "customer",
    });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (getCustomerProfile as jest.Mock).mockResolvedValue({ name: "Jane" });
    const element = await ProfilePage({});
    const linkWrapper = element.props.children[2];
    expect(linkWrapper.props.children.props.href).toBe(
      "/account/change-password",
    );
  });
});
