import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

type LoopStage = {
  id: string;
  stages?: string[];
  prompt_template?: string;
  condition?: string;
};

type LoopSpec = {
  stages: LoopStage[];
  ordering?: {
    sequential?: string[][];
  };
};

function repoPath(...segments: string[]): string {
  return path.resolve(__dirname, "../../../../", ...segments);
}

function readText(...segments: string[]): string {
  return fs.readFileSync(repoPath(...segments), "utf8");
}

function loadLoopSpec(): LoopSpec {
  const yaml = require("js-yaml") as typeof import("js-yaml");
  return yaml.load(readText("docs/business-os/startup-loop/loop-spec.yaml")) as LoopSpec;
}

describe("WEBSITE contract parity guards", () => {
  it("keeps WEBSITE runtime model stable in loop-spec", () => {
    const spec = loadLoopSpec();
    const websiteContainer = spec.stages.find((stage) => stage.id === "WEBSITE");
    const website01 = spec.stages.find((stage) => stage.id === "WEBSITE-01");
    const website02 = spec.stages.find((stage) => stage.id === "WEBSITE-02");

    expect(websiteContainer).toBeDefined();
    expect(websiteContainer?.stages).toEqual(["WEBSITE-01", "WEBSITE-02"]);

    expect(website01?.prompt_template).toBe(
      "docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md"
    );
    expect(website01?.condition).toBe("launch-surface = pre-website");

    expect(website02?.prompt_template).toBe(
      "docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md"
    );
    expect(website02?.condition).toBe("launch-surface = website-live");

    expect(spec.ordering?.sequential).toContainEqual(["S4", "WEBSITE"]);
    expect(spec.ordering?.sequential).toContainEqual(["WEBSITE", "DO"]);
  });

  it("keeps WEBSITE-01 handoff and DO auto-handover aligned across gate docs and workflow map", () => {
    const cmdStart = readText(".claude/skills/startup-loop/modules/cmd-start.md");
    const cmdAdvance = readText(".claude/skills/startup-loop/modules/cmd-advance.md");
    const workflow = readText("docs/business-os/startup-loop-workflow.user.md");

    expect(cmdStart).toContain("WEBSITE-01 handoff");
    expect(cmdStart).toContain(
      "docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md"
    );
    expect(cmdStart).toContain(
      "docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md"
    );
    expect(cmdStart).toContain(
      "/lp-do-fact-find --website-first-build-backlog --biz <BIZ>"
    );
    expect(cmdStart).toContain(
      "/lp-do-plan docs/plans/<biz>-website-v1-first-build/fact-find.md"
    );
    expect(cmdStart).toContain("/lp-do-build <biz>-website-v1-first-build");
    expect(cmdStart).toContain(
      "docs/plans/<biz>-website-v1-first-build/fact-find.md"
    );
    expect(cmdStart).toContain("docs/plans/<biz>-website-v1-first-build/plan.md");

    expect(cmdAdvance).toContain("GATE-WEBSITE-DO-01");
    expect(cmdAdvance).toContain(
      "/lp-do-fact-find --website-first-build-backlog --biz <BIZ>"
    );
    expect(cmdAdvance).toContain("/lp-do-plan");
    expect(cmdAdvance).toContain(
      "docs/plans/<biz>-website-v1-first-build/plan.md"
    );
    expect(cmdAdvance).toContain(
      "docs/plans/<biz>-website-v1-first-build/fact-find.md"
    );

    expect(workflow).toContain("| WEBSITE-01 L1 first build framework |");
    expect(workflow).toContain(
      "`docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`"
    );
    expect(workflow).toContain(
      "`docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`"
    );
    expect(workflow).toContain("| WEBSITE->DO first-build handover |");
    expect(workflow).toContain(
      "`docs/plans/<biz>-website-v1-first-build/fact-find.md`"
    );
    expect(workflow).toContain("| DO planning handover (first-build) |");
    expect(workflow).toContain(
      "`/lp-do-plan docs/plans/<biz>-website-v1-first-build/fact-find.md`"
    );
    expect(workflow).toContain(
      "`docs/plans/<biz>-website-v1-first-build/plan.md`"
    );
  });

  it("keeps process-layer WEBSITE ownership explicit via OFF-3", () => {
    const processRegistry = readText("docs/business-os/startup-loop/process-registry-v2.md");

    expect(processRegistry).toMatch(
      /\| OFF-3 \| Product \/ listing content and merchandising refresh \| OFF \| WEBSITE-01 \(bootstrap\), WEBSITE-02 \(recurring[^|]*\) \|/
    );
    expect(processRegistry).toContain(
      "| WEBSITE-01 | L1 first build framework | OFF-3 (first-build framework and content/listing baseline contract) |"
    );
    expect(processRegistry).toContain(
      "| WEBSITE-02 | Site-upgrade synthesis | OFF-3 (recurring content/listing refresh and merchandising iteration) |"
    );
    expect(processRegistry).toContain(
      "handover sequence `/lp-do-fact-find --website-first-build-backlog` -> `/lp-do-plan` is completed before `/lp-do-build`"
    );
  });
});
