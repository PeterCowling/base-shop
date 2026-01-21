import { describe, expect, it } from "@jest/globals";

import { createOidcAuthFlowStore } from "../src/oidc/flowStore";

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {
    SESSION_STORE_PROVIDER: undefined,
    SESSION_STORE: undefined,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  },
}));

describe("OidcAuthFlowStore", () => {
  it("stores and retrieves flow records in memory", async () => {
    const store = await createOidcAuthFlowStore();
    const record = {
      state: "state",
      nonce: "nonce",
      codeVerifier: "verifier",
      redirectUri: "https://shop.example.com/auth/callback",
      returnTo: "/account",
      flowId: "flow-id",
      createdAt: new Date(),
    };

    await store.set(record);
    await expect(store.get("state")).resolves.toMatchObject({
      state: "state",
      flowId: "flow-id",
      returnTo: "/account",
    });

    await store.delete("state");
    await expect(store.get("state")).resolves.toBeNull();
  });
});
