import { expect } from "chai";

describe("launch-shop SSE", () => {
  it("streams successful statuses", () => {
    const shopId = `cy-launch-${Date.now()}`;
    cy.request({
      method: "POST",
      url: "/cms/api/launch-shop",
      body: { shopId, state: {}, seed: true },
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const events = res.body
        .trim()
        .split("\n\n")
        .filter(Boolean)
        .map((line: string) => JSON.parse(line.replace(/^data: /, "")));
      const expected = ["create", "init", "seed", "deploy"];
      expected.forEach((step) => {
        const evt = events.find((e) => e.step === step);
        expect(evt, `${step} event`).to.exist;
        expect(evt!.status).to.eq("success");
      });
    });
  });
});
