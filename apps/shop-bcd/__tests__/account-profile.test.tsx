// apps/shop-bcd/__tests__/account-profile.test.tsx
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

  it("renders profile for authenticated users", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    const element = await ProfilePage();
    expect(element.type).toBe("div");
    expect(element.props.children[1].props.children).toBe(
      JSON.stringify(session, null, 2)
    );
  });

  it("updates displayed profile after session changes", async () => {
    const session1 = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session1);
    let element = await ProfilePage();
    expect(element.props.children[1].props.children).toBe(
      JSON.stringify(session1, null, 2)
    );

    const session2 = { customerId: "cust2", role: "admin" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session2);
    element = await ProfilePage();
    expect(element.props.children[1].props.children).toBe(
      JSON.stringify(session2, null, 2)
    );
  });
});
