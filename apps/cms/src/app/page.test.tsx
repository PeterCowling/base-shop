import { __setMockSession } from "next-auth";
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

describe("IndexPage", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("redirects to /cms when a session exists", async () => {
    const { redirect } = await import("next/navigation");
    __setMockSession({ user: { id: "1" } } as any);
    const { default: IndexPage } = await import("./page");
    await IndexPage();
    expect(redirect).toHaveBeenCalledWith("/cms");
  });

  it("redirects to /login when no session exists", async () => {
    const { redirect } = await import("next/navigation");
    __setMockSession(null as any);
    const { default: IndexPage } = await import("./page");
    await IndexPage();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
