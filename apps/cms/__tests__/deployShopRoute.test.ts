// Response.json() provided by shared test setup
function setSession(session: any) {
  const { __setMockSession } = require("next-auth") as {
    __setMockSession: (s: any) => void;
  };
  __setMockSession(session);
}
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

jest.mock("@cms/actions/deployShop.server", () => ({
  deployShopHosting: jest.fn(),
  getDeployStatus: jest.fn(),
  updateDeployStatus: jest.fn(),
}));
process.env.CMS_SPACE_URL = "https://cms.example";
process.env.CMS_ACCESS_TOKEN = "token";
process.env.SANITY_API_VERSION = "v1";
process.env.STRIPE_WEBHOOK_SECRET = "whsec";
process.env.EMAIL_FROM = "from@example.com";

describe("deploy-shop API route", () => {
  let actions: {
    deployShopHosting: jest.Mock;
    getDeployStatus: jest.Mock;
    updateDeployStatus: jest.Mock;
  };

  beforeEach(() => {
    jest.resetModules();
    actions = require("@cms/actions/deployShop.server");
    actions.deployShopHosting.mockReset();
    actions.getDeployStatus.mockReset();
    actions.updateDeployStatus.mockReset();
  });

  describe("POST", () => {
    it("deploys shop when authorized", async () => {
      setSession({ user: { role: "admin" } });
      actions.deployShopHosting.mockResolvedValueOnce({ id: "123" });
      const { getServerSession } = await import("next-auth");
      const probe = await getServerSession({} as any);
      expect(probe).toEqual({ user: { role: "admin" } });
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "POST",
        body: JSON.stringify({ id: "123", domain: "example.com" }),
      });
      const res = await route.POST(req);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ id: "123" });
      expect(actions.deployShopHosting).toHaveBeenCalledWith("123", "example.com");
    });

    it("returns 403 when unauthorized", async () => {
      setSession(null);
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "POST",
        body: JSON.stringify({ id: "123" }),
      });
      const res = await route.POST(req);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    });

    it("returns 400 when action throws", async () => {
      setSession({ user: { role: "admin" } });
      actions.deployShopHosting.mockRejectedValueOnce(new Error("bad"));
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "POST",
        body: JSON.stringify({ id: "123" }),
      });
      const res = await route.POST(req);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "bad" });
    });
  });

  describe("GET", () => {
    it("returns deploy status when authorized", async () => {
      setSession({ user: { role: "ShopAdmin" } });
      actions.getDeployStatus.mockResolvedValueOnce({ status: "ok" });
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop?id=42");
      const res = await route.GET(req);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ status: "ok" });
      expect(actions.getDeployStatus).toHaveBeenCalledWith("42");
    });

    it("returns 403 when unauthorized", async () => {
      setSession(null);
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop?id=42");
      const res = await route.GET(req);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    });

    it("returns 400 when id missing", async () => {
      setSession({ user: { role: "admin" } });
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop");
      const res = await route.GET(req);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Missing id" });
    });
  });

  describe("PUT", () => {
    it("updates status when authorized", async () => {
      setSession({ user: { role: "admin" } });
      actions.updateDeployStatus.mockResolvedValueOnce(undefined);
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "PUT",
        body: JSON.stringify({ id: "7", domainStatus: "ready" }),
      });
      const res = await route.PUT(req);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(actions.updateDeployStatus).toHaveBeenCalledWith("7", { domainStatus: "ready" });
    });

    it("returns 403 when unauthorized", async () => {
      setSession(null);
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "PUT",
        body: JSON.stringify({ id: "7" }),
      });
      const res = await route.PUT(req);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
    });

    it("returns 400 when id missing", async () => {
      setSession({ user: { role: "admin" } });
      const route = await import("../src/app/api/deploy-shop/route");
      const req = new Request("http://localhost/api/deploy-shop", {
        method: "PUT",
        body: JSON.stringify({ domainStatus: "ready" }),
      });
      const res = await route.PUT(req);
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Missing id" });
    });
  });
});
