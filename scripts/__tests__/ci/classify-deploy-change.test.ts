import { describe, expect, it } from "@jest/globals";

import { classifyDeployChange } from "../../src/ci/classify-deploy-change";

describe("classifyDeployChange", () => {
  it("TC-01: classifies workflow-only paths as deploy-only and skips tests", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      ".github/workflows/reusable-app.yml",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
      testScope: "skip",
      relatedTestPaths: [],
    });
  });

  it("TC-02: classifies mixed workflow and runtime code paths with related-test scope", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      "apps/brikette/src/app/page.tsx",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: false,
      reason: "runtime_path_detected",
      testScope: "related",
      relatedTestPaths: ["apps/brikette/src/app/page.tsx"],
    });
  });

  it("TC-03: classifies irrelevant path categories as uncertain with test-skip scope", () => {
    const result = classifyDeployChange(["docs/new-area/unknown-contract.md"]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: true,
      reason: "irrelevant_path_set",
      testScope: "skip",
      relatedTestPaths: [],
      relevantPaths: [],
      ignoredPaths: ["docs/new-area/unknown-contract.md"],
    });
  });

  it("TC-04: classifies empty path set as uncertain", () => {
    const result = classifyDeployChange([]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: true,
      reason: "empty_path_set",
      testScope: "skip",
      relatedTestPaths: [],
    });
  });

  it("TC-05: classifies wrangler deploy config as deploy-only", () => {
    const result = classifyDeployChange(["apps/brikette/wrangler.toml"]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
      testScope: "skip",
      relatedTestPaths: [],
    });
  });

  it("TC-06: ignores non-Brikette app paths when deploy-only Brikette paths are present", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      "apps/prime/src/components/homepage/HomePage.tsx",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
      testScope: "skip",
      relatedTestPaths: [],
      deployPaths: [".github/workflows/brikette.yml"],
      ignoredPaths: ["apps/prime/src/components/homepage/HomePage.tsx"],
    });
  });

  it("TC-07: skips tests when runtime paths are not related-test eligible", () => {
    const result = classifyDeployChange(["apps/brikette/public/img/hero.jpg"]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: false,
      reason: "runtime_path_detected",
      testScope: "skip",
      relatedTestPaths: [],
      runtimePaths: ["apps/brikette/public/img/hero.jpg"],
    });
  });

  it("TC-08: treats mixed runtime and global-impact unknown paths as uncertain with related scope when possible", () => {
    const result = classifyDeployChange([
      "apps/brikette/src/components/header/Header.tsx",
      "package.json",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: true,
      reason: "unknown_path_detected",
      testScope: "related",
      relatedTestPaths: ["apps/brikette/src/components/header/Header.tsx"],
      runtimePaths: ["apps/brikette/src/components/header/Header.tsx"],
      unknownPaths: ["package.json"],
    });
  });

  it("TC-09: narrows related scope to eligible runtime files when mixed with static assets", () => {
    const result = classifyDeployChange([
      "apps/brikette/src/components/header/Header.tsx",
      "apps/brikette/public/img/hero.jpg",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: false,
      uncertain: false,
      reason: "runtime_path_detected",
      testScope: "related",
      relatedTestPaths: ["apps/brikette/src/components/header/Header.tsx"],
      runtimePaths: [
        "apps/brikette/src/components/header/Header.tsx",
        "apps/brikette/public/img/hero.jpg",
      ],
    });
  });

  it("TC-10: ignores non-runtime scripts when deploy-only Brikette paths are present", () => {
    const result = classifyDeployChange([
      ".github/workflows/brikette.yml",
      "scripts/agents/integrator-shell.sh",
    ]);

    expect(result).toMatchObject({
      isDeployOnly: true,
      uncertain: false,
      reason: "deploy_only_paths",
      testScope: "skip",
      relatedTestPaths: [],
      deployPaths: [".github/workflows/brikette.yml"],
      ignoredPaths: ["scripts/agents/integrator-shell.sh"],
    });
  });
});
