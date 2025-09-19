/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";

import { JWT_SECRET, OAUTH_SECRET, loadProdSchema, prodSecrets } from "./authTestHelpers";

describe("auth schema provider dependencies", () => {
  it("requires JWT_SECRET for AUTH_PROVIDER=jwt", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      AUTH_PROVIDER: "jwt",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      JWT_SECRET: {
        _errors: ["JWT_SECRET is required when AUTH_PROVIDER=jwt"],
      },
    });
  });

  it("requires oauth client credentials for AUTH_PROVIDER=oauth", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      AUTH_PROVIDER: "oauth",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      OAUTH_CLIENT_ID: {
        _errors: ["OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth"],
      },
      OAUTH_CLIENT_SECRET: {
        _errors: ["OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth"],
      },
    });
  });

  it("parses valid oauth provider configuration", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_CLIENT_SECRET: OAUTH_SECRET,
    });
    expect(result.success).toBe(true);
  });

  it("parses valid jwt provider configuration", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      AUTH_PROVIDER: "jwt",
      JWT_SECRET,
    });
    expect(result.success).toBe(true);
  });
});
