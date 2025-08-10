// apps/shop-abc/__tests__/accountProfile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import ProfilePage from "../src/app/account/profile/page";

describe("/account/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const element = await ProfilePage();
    expect(getCustomerSession).toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Please log in to view your profile.");
  });

  it("renders profile form for authenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "cust1" });
    const element = await ProfilePage();
    expect(element.type).toBe("div");
    expect(element.props.children[0].props.children).toBe("Profile");
    expect(element.props.children[1].type.name).toBe("ProfileForm");
  });
});
