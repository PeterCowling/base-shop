/** @jest-environment node */
import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(async (dir) => {
    await cb(dir);
  }, { prefix: 'pages-' });

function mockAuth() {
  const { __setMockSession } = require('next-auth') as { __setMockSession: (s: any) => void };
  __setMockSession({ user: { role: 'admin', email: 'admin@example.com' } });
}

describe("pages API validation", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns 400 when component structure is invalid", async () => {
    await withRepo(async () => {
      mockAuth();
      jest.doMock("@acme/config", () => ({ env: { NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!", EMAIL_FROM: "test@example.com", EMAIL_PROVIDER: "noop" } }));
      const route = await import("../src/app/api/page-draft/[shop]/route");
      const fd = new FormData();
      fd.append("components", '[{"id":"c1"}]'); // missing type
      const req = { formData: () => Promise.resolve(fd) } as any;
      const res = await route.POST(req, { params: Promise.resolve({ shop: "test" }) });
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.errors.components[0]).toBe("Invalid components");
    });
  });
});
