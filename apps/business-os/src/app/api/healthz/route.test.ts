/**
 * Tests for /api/healthz health check endpoint
 * MVP-A2: Health endpoint
 */

import { GET } from "./route";

describe("/api/healthz", () => {
  it("should return 200 status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("should return JSON response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toBeDefined();
    expect(typeof data).toBe("object");
  });

  it("should include gitHead in response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.gitHead).toBeDefined();
    expect(typeof data.gitHead).toBe("string");
    expect(data.gitHead.length).toBeGreaterThan(0);
  });

  it("should include repoLockStatus in response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.repoLockStatus).toBeDefined();
    expect(["unlocked", "locked", "unknown", "error"]).toContain(
      data.repoLockStatus
    );
  });

  it("should include lastAgentRunTimestamp in response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toHaveProperty("lastAgentRunTimestamp");
    // Can be null if no agent runs exist
    if (data.lastAgentRunTimestamp !== null) {
      expect(typeof data.lastAgentRunTimestamp).toBe("string");
      // Should be valid ISO timestamp
      expect(() => new Date(data.lastAgentRunTimestamp)).not.toThrow();
    }
  });

  it("should include timestamp in response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe("string");
    // Should be valid ISO timestamp
    expect(() => new Date(data.timestamp)).not.toThrow();
  });

  it("should include status ok in response", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe("ok");
  });
});
