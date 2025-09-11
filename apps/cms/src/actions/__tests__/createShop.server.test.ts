import { createNewShop } from "../createShop.server";

jest.mock("@platform-core/createShop", () => ({
  createShop: jest.fn(),
}));

jest.mock("@platform-core/db", () => ({
  prisma: {
    page: { deleteMany: jest.fn() },
    shop: { delete: jest.fn() },
  },
}));

jest.mock("../../lib/server/rbacStore", () => ({
  readRbac: jest.fn(),
  writeRbac: jest.fn(),
}));

jest.mock("../common/auth.ts", () => ({
  ensureAuthorized: jest.fn(),
}));

describe("createNewShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Successful shop creation with RBAC update for new user", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import("../../lib/server/rbacStore");
    const { ensureAuthorized } = await import("../common/auth.ts");

    const deployResult = { status: "ok" } as any;
    (createShop as jest.Mock).mockResolvedValue(deployResult);
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: { id: "user1" } });

    const result = await createNewShop("shop1", {} as any);

    expect(result).toBe(deployResult);
    expect(writeRbac).toHaveBeenCalledWith(
      expect.objectContaining({ roles: { user1: "ShopAdmin" } })
    );
  });

  it.each([
    { current: ["Viewer"], expected: ["Viewer", "ShopAdmin"], shouldWrite: true },
    { current: "Viewer", expected: ["Viewer", "ShopAdmin"], shouldWrite: true },
    { current: ["Viewer", "ShopAdmin"], expected: ["Viewer", "ShopAdmin"], shouldWrite: false },
    { current: "ShopAdmin", expected: "ShopAdmin", shouldWrite: false },
  ])(
    "Existing role array vs single role %#",
    async ({ current, expected, shouldWrite }) => {
      const { createShop } = await import("@platform-core/createShop");
      const { readRbac, writeRbac } = await import(
        "../../lib/server/rbacStore"
      );
      const { ensureAuthorized } = await import("../common/auth.ts");

      (createShop as jest.Mock).mockResolvedValue({});
      (readRbac as jest.Mock).mockResolvedValue({
        users: {},
        roles: { user1: current },
        permissions: {},
      });
      (ensureAuthorized as jest.Mock).mockResolvedValue({
        user: { id: "user1" },
      });

      await createNewShop("shop1", {} as any);
      if (shouldWrite) {
        expect(writeRbac).toHaveBeenCalledWith(
          expect.objectContaining({ roles: { user1: expected } })
        );
      } else {
        expect(writeRbac).not.toHaveBeenCalled();
      }
    }
  );

  it("Propagates createShop error without touching RBAC", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import("../../lib/server/rbacStore");
    const { ensureAuthorized } = await import("../common/auth.ts");

    const err = new Error("deploy failed");
    (createShop as jest.Mock).mockRejectedValue(err);
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: { id: "user1" } });

    await expect(createNewShop("shop1", {} as any)).rejects.toBe(err);
    expect(readRbac).not.toHaveBeenCalled();
    expect(writeRbac).not.toHaveBeenCalled();
  });

  it("Failure reading RBAC → verify rollback deletes created entities and throws", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import("../../lib/server/rbacStore");
    const { ensureAuthorized } = await import("../common/auth.ts");
    const { prisma } = await import("@platform-core/db");

    (createShop as jest.Mock).mockResolvedValue({});
    (readRbac as jest.Mock).mockRejectedValue(new Error("fail"));
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: { id: "user1" } });

    await expect(createNewShop("shop1", {} as any)).rejects.toThrow(
      "Failed to assign ShopAdmin role"
    );
    expect(prisma.page.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "shop1" },
    });
    expect(prisma.shop.delete).toHaveBeenCalledWith({ where: { id: "shop1" } });
    expect(writeRbac).not.toHaveBeenCalled();
  });

  it("Failure writing RBAC → verify rollback deletes created entities and throws", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import("../../lib/server/rbacStore");
    const { ensureAuthorized } = await import("../common/auth.ts");
    const { prisma } = await import("@platform-core/db");

    (createShop as jest.Mock).mockResolvedValue({});
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    (writeRbac as jest.Mock).mockRejectedValue(new Error("fail"));

    await expect(createNewShop("shop1", {} as any)).rejects.toThrow(
      "Failed to assign ShopAdmin role"
    );
    expect(prisma.page.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "shop1" },
    });
    expect(prisma.shop.delete).toHaveBeenCalledWith({ where: { id: "shop1" } });
  });

  it("Logs rollback failure when RBAC write fails", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import(
      "../../lib/server/rbacStore"
    );
    const { ensureAuthorized } = await import("../common/auth.ts");
    const { prisma } = await import("@platform-core/db");

    (createShop as jest.Mock).mockResolvedValue({});
    (readRbac as jest.Mock).mockResolvedValue({
      users: {},
      roles: {},
      permissions: {},
    });
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: { id: "user1" } });
    (writeRbac as jest.Mock).mockRejectedValue(new Error("fail"));
    (prisma.page.deleteMany as jest.Mock).mockRejectedValue(
      new Error("rollback fail")
    );
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(createNewShop("shop1", {} as any)).rejects.toThrow(
      "Failed to assign ShopAdmin role"
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to roll back shop creation",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("Ensure user without id skips RBAC update", async () => {
    const { createShop } = await import("@platform-core/createShop");
    const { readRbac, writeRbac } = await import("../../lib/server/rbacStore");
    const { ensureAuthorized } = await import("../common/auth.ts");

    const deployResult = { status: "ok" } as any;
    (createShop as jest.Mock).mockResolvedValue(deployResult);
    (ensureAuthorized as jest.Mock).mockResolvedValue({ user: {} });

    const result = await createNewShop("shop1", {} as any);

    expect(result).toBe(deployResult);
    expect(readRbac).not.toHaveBeenCalled();
    expect(writeRbac).not.toHaveBeenCalled();
  });
});

