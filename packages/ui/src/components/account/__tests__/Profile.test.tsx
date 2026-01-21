import { redirect } from "next/navigation";
import { render, screen } from "@testing-library/react";

import ProfilePage from "../Profile";

const getCustomerSession = jest.fn();
const hasPermission = jest.fn();
jest.mock("@acme/auth", () => ({
  getCustomerSession: () => getCustomerSession(),
  hasPermission: (...args: any[]) => hasPermission(...args),
}));

const getCustomerProfile = jest.fn();
jest.mock("@acme/platform-core/customerProfiles", () => ({
  getCustomerProfile: (...args: any[]) => getCustomerProfile(...args),
}));

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to login when session missing", async () => {
    getCustomerSession.mockResolvedValue(null);
    const result = await ProfilePage({ callbackUrl: "/dest" });
    expect(redirect).toHaveBeenCalledWith("/login?callbackUrl=%2Fdest");
    expect(result).toBeNull();
  });

  it("renders change password link when permitted", async () => {
    getCustomerSession.mockResolvedValue({ customerId: "1", role: "admin" });
    getCustomerProfile.mockResolvedValue({ name: "n", email: "e" });
    hasPermission.mockReturnValue(true);
    const element = await ProfilePage({});
    render(element);
    expect(screen.getByText("Change password")).toBeInTheDocument();
  });

  it("omits change password link without permission", async () => {
    getCustomerSession.mockResolvedValue({ customerId: "1", role: "user" });
    getCustomerProfile.mockResolvedValue({ name: "n", email: "e" });
    hasPermission.mockReturnValue(false);
    const element = await ProfilePage({});
    render(element);
    expect(screen.queryByText("Change password")).toBeNull();
  });
});
