// cypress/e2e/mfa-login.cy.ts
describe("MFA login", () => {
  it("allows login with valid TOTP", () => {
    cy.task("generateMfaToken", "cust1").then((token: string) => {
      cy.setCookie("csrf_token", "csrf");
      cy.request({
        method: "POST",
        url: "/api/login",
        headers: { "x-csrf-token": "csrf" },
        body: {
          customerId: "cust1",
          password: "pass1pass",
          mfaToken: token,
        },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.deep.eq({ ok: true });
      });
    });
  });
});
