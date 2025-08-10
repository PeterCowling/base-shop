// apps/shop-bcd/__tests__/account-profile.test.tsx
import { jest } from "@jest/globals";

const getCustomerSession = jest.fn();
const getCustomerProfile = jest.fn();

jest.unstable_mockModule("@auth", () => ({ getCustomerSession }));
jest.unstable_mockModule("@acme/platform-core", () => ({ getCustomerProfile }));

const { default: ProfilePage } = await import("../src/app/account/profile/page");

describe("/account/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users", async () => {
    getCustomerSession.mockResolvedValue(null);
    const element = await ProfilePage();
    expect(getCustomerSession).toHaveBeenCalled();
    expect(element.type).toBe("p");
    expect(element.props.children).toBe("Please log in to view your profile.");
  });

  it("renders profile form for authenticated users", async () => {
    getCustomerSession.mockResolvedValue({ customerId: "cust1" });
    getCustomerProfile.mockResolvedValue({
      name: "Jane",
      email: "jane@example.com",
      customerId: "cust1",
    });
    const element = await ProfilePage();
    expect(getCustomerProfile).toHaveBeenCalledWith("cust1");
    expect(element.type).toBe("div");
    expect(element.props.children[0].props.children).toBe("Profile");
    expect(element.props.children[1].props.name).toBe("Jane");
    expect(element.props.children[1].props.email).toBe("jane@example.com");
  });
});
