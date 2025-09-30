import * as sanityClient from "@sanity/client";
import { verifyCredentials } from "../../packages/plugins/sanity/index.ts";
import { connectSanity, createSanityPost } from "../../apps/cms/src/actions/sanity.server.ts";

describe("Sanity blog workflow", () => {
  beforeEach(() => {
    cy.stub(sanityClient, "createClient").returns({
      datasets: { get: cy.stub().resolves({}) },
      create: cy.stub().resolves({ _id: "1", _type: "post", title: "Hello" }),
    });
  });

  it("connects and publishes a post", () => {
    const config = { projectId: "p", dataset: "d", token: "t" };
    cy.wrap(verifyCredentials(config)).should("eq", true);

    const fd = new FormData();
    fd.set("projectId", config.projectId);
    fd.set("dataset", config.dataset);
    fd.set("token", config.token);
    fd.set("post", JSON.stringify({ title: "Hello" }));

    cy.wrap(connectSanity(fd)).should("eq", true);
    cy.wrap(createSanityPost(fd)).should(
      "deep.include",
      { _type: "post", title: "Hello" }
    );
  });
});
