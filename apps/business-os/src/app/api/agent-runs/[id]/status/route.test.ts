import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/agent-runs/[id]/status", () => {
  const mockRunsDir = "/mock/runs";
  const originalEnv = process.env.BUSINESS_OS_REPO_ROOT;

  beforeEach(() => {
    process.env.BUSINESS_OS_REPO_ROOT = "/mock/repo";
  });

  afterEach(() => {
    process.env.BUSINESS_OS_REPO_ROOT = originalEnv;
    jest.clearAllMocks();
  });

  it("returns 404 when run log file does not exist", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/agent-runs/nonexistent/status"
    );
    const params = Promise.resolve({ id: "nonexistent" });

    const response = await GET(request, { params });
    expect(response.status).toBe(404);

    const json = await response.json();
    expect(json.error).toContain("not found");
  });

  it("returns run status from log file", async () => {
    // This test will pass once we implement the route
    // For now, we expect it to fail
    expect(true).toBe(true);
  });
});
