// test/e2e/upgrade-rollback.spec.ts

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rest, server } from "../../msw/server";

describe("Upgrade and rollback flow", () => {
  const slug = "bcd";
  const shopJson = join(
    process.cwd(),
    "data",
    "shops",
    slug,
    "shop.json",
  );

  let original: any;

  before(() => {
    original = JSON.parse(readFileSync(shopJson, "utf8"));
    server.listen({ onUnhandledRequest: "error" });
    server.use(
      rest.post("/cms/api/upgrade-shop", (_req, res, ctx) => {
        const upgraded = {
          ...original,
          lastUpgrade: new Date().toISOString(),
          componentVersions: { pkg: "2.0.0" },
        };
        writeFileSync(shopJson, JSON.stringify(upgraded));
        return res(ctx.status(200), ctx.json({ status: "ok" }));
      }),
      rest.post("/cms/api/shop/:shop/rollback", (_req, res, ctx) => {
        writeFileSync(shopJson, JSON.stringify(original));
        return res(ctx.status(200), ctx.json({ status: "ok" }));
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
    writeFileSync(shopJson, JSON.stringify(original));
  });

  after(() => {
    server.close();
  });

  it("upgrades then rolls back a shop", () => {
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email: "admin@example.com",
          password: "admin",
          callbackUrl: "/cms",
        },
      });
    });

    cy.request("POST", "/cms/api/upgrade-shop", { shop: slug })
      .its("status")
      .should("eq", 200);

    cy.readFile(shopJson).then((data) => {
      expect(data.lastUpgrade).not.to.equal(original.lastUpgrade);
      expect(data.componentVersions.pkg).to.equal("2.0.0");
    });

    cy.request("POST", `/cms/api/shop/${slug}/rollback`)
      .its("status")
      .should("eq", 200);

    cy.readFile(shopJson).should((data) => {
      expect(data).to.deep.equal(original);
    });
  });
});
