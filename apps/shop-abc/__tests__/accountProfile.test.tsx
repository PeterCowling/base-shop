// apps/shop-abc/__tests__/accountProfile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import ProfilePage from "../src/app/account/profile/page";
import ProfileForm from "../src/app/account/profile/ProfileForm";

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

  it("renders ProfileForm for authenticated users", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    const element = await ProfilePage();
    const form = element.props.children[1];
    expect(form.type).toBe(ProfileForm);
    expect(form.props.name).toBeUndefined();
    expect(form.props.email).toBeUndefined();
    // TODO: expect prefilled values once profile retrieval is implemented
  });
});
