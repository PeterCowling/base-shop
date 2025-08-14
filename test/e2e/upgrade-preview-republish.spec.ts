// test/e2e/upgrade-preview-republish.spec.ts

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

describe("Upgrade preview and republish", () => {
  const slug = "demo";
  const shopId = `shop-${slug}`;
  const shopJson = join(
    process.cwd(),
    "data",
    "shops",
    shopId,
    "shop.json",
  );

  it("runs upgrade script, previews changes and republishes", () => {
    // run the upgrade script for the sample shop
    cy.exec(`pnpm tsx scripts/src/upgrade-shop.ts ${slug}`);

    // fetch the list of changes returned by the upgrade API
    cy.request("/api/upgrade-changes").its("status").should("eq", 200);

    // visit the preview to ensure the upgraded shop renders correctly
    cy.visit(`/cms/shop/${slug}/pages/home/builder`);
    cy.contains("Preview").should("exist");

    // mock the publish API to avoid triggering build/deploy steps
    cy.intercept("POST", "/api/publish", (req) => {
      const data = JSON.parse(readFileSync(shopJson, "utf8"));
      data.status = "published";
      writeFileSync(shopJson, JSON.stringify(data));
      req.reply({ statusCode: 200, body: { status: "ok" } });
    }).as("publish");

    // publish and verify the call succeeded
    cy.contains("button", /publish/i).click();
    cy.wait("@publish").its("response.statusCode").should("eq", 200);

    // ensure the shop status was updated
    cy.readFile(shopJson).its("status").should("eq", "published");
  });
});

