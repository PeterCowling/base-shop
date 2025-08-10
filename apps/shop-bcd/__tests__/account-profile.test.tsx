// apps/shop-bcd/__tests__/account-profile.test.tsx
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));
jest.mock("@platform-core/profile", () => ({
  __esModule: true,
  profileGet: jest.fn(),
}));

import { getCustomerSession } from "@auth";
import { profileGet } from "@platform-core/profile";
import ProfilePage from "../src/app/account/profile/page";

describe("/account/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const element = await ProfilePage();
    expect(getCustomerSession).toHaveBeenCalled();
    expect(profileGet).not.toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Please log in to view your profile.");
  });

  it("renders profile for authenticated users", async () => {
    const session = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session);
    (profileGet as jest.Mock).mockResolvedValue({
      name: "Alice",
      email: "alice@example.com",
    });
    const element = await ProfilePage();
    expect(profileGet).toHaveBeenCalledWith("bcd", session.customerId);
    expect(element.type).toBe("div");
    const formProps = element.props.children[1].props;
    expect(formProps.name).toBe("Alice");
    expect(formProps.email).toBe("alice@example.com");
  });

  it("updates displayed profile after session changes", async () => {
    const session1 = { customerId: "cust1", role: "user" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session1);
    (profileGet as jest.Mock).mockResolvedValue({
      name: "Alice",
      email: "alice@example.com",
    });
    let element = await ProfilePage();
    let formProps = element.props.children[1].props;
    expect(formProps.name).toBe("Alice");
    expect(formProps.email).toBe("alice@example.com");

    const session2 = { customerId: "cust2", role: "admin" };
    (getCustomerSession as jest.Mock).mockResolvedValue(session2);
    (profileGet as jest.Mock).mockResolvedValue({
      name: "Bob",
      email: "bob@example.com",
    });
    element = await ProfilePage();
    formProps = element.props.children[1].props;
    expect(formProps.name).toBe("Bob");
    expect(formProps.email).toBe("bob@example.com");
  });
});
