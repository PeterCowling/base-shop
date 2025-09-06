import { authenticator } from "otplib";
import { enrollMfa, verifyMfa } from "@auth";

describe("MFA login", () => {
  it("allows login with TOTP", () => {
    cy.then(async () => {
      const { secret } = await enrollMfa("cust1");
      const initial = authenticator.generate(secret);
      await verifyMfa("cust1", initial);
      const csrf = "csrf-token";
      return { secret, csrf };
    }).then(({ secret, csrf }) => {
      cy.setCookie("csrf_token", csrf);
      const mfaToken = authenticator.generate(secret);
      cy.request({
        method: "POST",
        url: "/api/login",
        headers: { "x-csrf-token": csrf, "x-mfa-token": mfaToken },
        body: { customerId: "cust1", password: "pass1234" },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.deep.equal({ ok: true });
      });
    });
  });
});
