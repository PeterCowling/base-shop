// apps/shop-abc/__tests__/accountProfile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@platform-core", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@platform-core";
import ProfilePage from "@ui/src/components/account/Profile";
import ProfileForm from "@ui/src/components/account/ProfileForm";
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
    expect(element.type).toBe("div");
    expect(element.props.children[0].props.children).toBe("Profile");
    const form = element.props.children[1];
    expect(form.type).toBe(ProfileForm);
    expect(form.props).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
    });
  });
});
