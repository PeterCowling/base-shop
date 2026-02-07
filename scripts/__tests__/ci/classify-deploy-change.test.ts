import { describe, expect, it } from "@jest/globals";

import { classifyDeployChange } from "../../src/ci/classify-deploy-change";

describe("classifyDeployChange", () => {
  it("TC-01: classifies workflow-only paths as deploy-only and confident", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      ".github/workflows/reusable-app.yml",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
    });
  });

  it("TC-02: classifies mixed workflow and runtime code paths as non-deploy-only", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      "apps/brikette/src/app/page.tsx",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: false,
      reason: "runtime_path_detected",
    });
  });

  it("TC-03: classifies unknown path categories as uncertain", () => {
    const result = classifyDeployChange(["docs/new-area/unknown-contract.md"]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: true,
      reason: "unknown_path_detected",
    });
  });

  it("TC-04: classifies empty path set as uncertain", () => {
    const result = classifyDeployChange([]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: true,
      reason: "empty_path_set",
    });
  });

  it("TC-05: classifies wrangler deploy config as deploy-only", () => {
    const result = classifyDeployChange(["apps/brikette/wrangler.toml"]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
    });
  });
});
