import fs from "node:fs/promises";
import path from "node:path";
import { render } from "@testing-library/react";
import { withTempRepo } from "@acme/test-utils";

process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
process.env.CART_COOKIE_SECRET = "test-secret";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

const withRepo = (cb: () => Promise<void>) =>
  withTempRepo(async () => {
    await cb();
  }, { prefix: 'rbac-', createShopDir: false });

afterEach(() => jest.resetAllMocks());

describe("PermissionsPage storefront roles", () => {
  it("renders storefront roles", async () => {
    await withRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest
          .fn()
          .mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("next/navigation", () => ({ redirect: jest.fn() }));
      jest.doMock(
        "@/components/atoms/shadcn",
        () => {
          const React = require("react");
          return {
            __esModule: true,
            Button: ({ children, ...props }: any) => (
              <button {...props}>{children}</button>
            ),
          };
        },
        { virtual: true }
      );

      const { default: PermissionsPage } = await import(
        "../src/app/cms/rbac/permissions/page"
      );
      const { container } = render(await PermissionsPage());
      expect(container.innerHTML).toContain("customer");
      expect(container.innerHTML).toContain("viewer");
    });
  });

  it("updates customer permissions", async () => {
    await withRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest
          .fn()
          .mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("next/navigation", () => ({ redirect: jest.fn() }));
      jest.doMock(
        "@/components/atoms/shadcn",
        () => {
          const React = require("react");
          return {
            __esModule: true,
            Button: ({ children, ...props }: any) => (
              <button {...props}>{children}</button>
            ),
          };
        },
        { virtual: true }
      );

      const { updateRolePermissions } = await import(
        "../src/actions/rbac.server"
      );
      const { readRbac } = await import("../src/lib/server/rbacStore");

      const form = new FormData();
      form.append("role", "customer");
      form.append("permissions", "view_products");

      await updateRolePermissions(form);
      const db = await readRbac();
      expect(db.permissions.customer).toEqual(["view_products"]);
    });
  });
});
