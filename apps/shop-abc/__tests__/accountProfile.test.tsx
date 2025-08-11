// apps/shop-abc/__tests__/accountProfile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@acme/platform-core", () => ({
  __esModule: true,
  getCustomerProfile: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn() })),
}));

import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@acme/platform-core";
import ProfilePage from "@ui/src/components/account/Profile";
import ProfileForm from "@ui/src/components/account/ProfileForm";

describe("/account/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const element = await ProfilePage({});
    expect(getCustomerSession).toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Please log in to view your profile.");
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
