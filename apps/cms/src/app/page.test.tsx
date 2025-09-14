jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

describe("IndexPage", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("redirects to /cms when a session exists", async () => {
    const { getServerSession } = await import("next-auth");
    const { redirect } = await import("next/navigation");
    (getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: "1" } });
    const { default: IndexPage } = await import("./page");
    await IndexPage();
    expect(redirect).toHaveBeenCalledWith("/cms");
  });

  it("redirects to /login when no session exists", async () => {
    const { getServerSession } = await import("next-auth");
    const { redirect } = await import("next/navigation");
    (getServerSession as jest.Mock).mockResolvedValueOnce(null);
    const { default: IndexPage } = await import("./page");
    await IndexPage();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});

