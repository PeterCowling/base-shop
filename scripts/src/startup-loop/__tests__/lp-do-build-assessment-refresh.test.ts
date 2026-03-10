import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  inferBusinessesFromChangedFiles,
  runAssessmentPostBuildRefresh,
} from "../build/lp-do-build-assessment-refresh.js";

let tmpDir = "";

async function writeFile(relativePath: string, content: string): Promise<void> {
  const absolutePath = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf-8");
}

async function readFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(tmpDir, relativePath), "utf-8");
}

const intakePacketFixture = `---
Type: Startup-Intake-Packet
Status: Active
Business: TEST
Created: 2026-02-12
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
---

# TEST Intake Packet

## A) Intake Summary

- Naming: unconfirmed - working recommendation is Nidilo; TM/domain clearance required (ASSESSMENT-04).

## B) Business and Product Packet

| Field | Value | Source |
|---|---|---|
| Business code | TEST | - |
| Business name | Nidilo (working recommendation; not yet cleared) | ASSESSMENT-04 |
| Business name status | unconfirmed - shortlist returned; TM/domain clearance required before commitment | ASSESSMENT-04 |
| Naming territory | Territory B: lifestyle/everyday normalisation; coined masterbrand | ASSESSMENT-04 |

## D) Constraints and Assumptions Register

| Item | Source | Evidence / note | Confidence |
|---|---|---|---|
| Naming remains provisional until TM/domain clearance | ASSESSMENT-04 | Clearance sequence not yet run | Medium |
`;

const nameDecisionFixture = `---
Type: Decision-Record
Decision-ID: DEC-TEST-NAME-01
Business: TEST
Category: naming
Date: 2026-02-26
Status: Active
Owner: Pete
---

# Brand Name Decision - TEST

## Decision

**Selected brand name: Facilella**

- Domain: facilella.com (REGISTERED - 2026-02-26)
- Territory: Easy Hair System
`;

const seedOnceFixture = `---
Type: Current-Problem-Framing
Business-Unit: TEST
Business-Name: Nidilo
Status: Active
Created: 2026-02-23
Updated: 2026-02-23
Seed-Source: docs/business-os/startup-baselines/TEST/2026-02-12-assessment-intake-packet.user.md
---

Do NOT re-seed from intake packet on refresh.
`;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "assessment-refresh-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("inferBusinessesFromChangedFiles", () => {
  it("returns businesses for qualifying name decision paths only", () => {
    const businesses = inferBusinessesFromChangedFiles([
      "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      "docs/business-os/strategy/TEST/assessment/current-problem-framing.user.md",
      "docs/business-os/strategy/OTHER/assessment/DEC-WRONG-NAME-01.user.md",
    ]);

    expect(businesses).toEqual(["TEST"]);
  });
});

describe("runAssessmentPostBuildRefresh", () => {
  it("TC-01: applies confirmed name decision to intake packet only", async () => {
    await writeFile(
      "docs/business-os/startup-baselines/TEST/2026-02-12-assessment-intake-packet.user.md",
      intakePacketFixture,
    );
    await writeFile(
      "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      nameDecisionFixture,
    );
    await writeFile(
      "docs/business-os/strategy/TEST/assessment/current-problem-framing.user.md",
      seedOnceFixture,
    );

    const seedOnceBefore = await readFile(
      "docs/business-os/strategy/TEST/assessment/current-problem-framing.user.md",
    );

    const actions = runAssessmentPostBuildRefresh({
      rootDir: tmpDir,
      changedFiles: [
        "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      ],
      today: "2026-03-09",
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      business: "TEST",
      status: "applied",
      reason: "name_decision_applied",
    });

    const refreshedIntake = await readFile(
      "docs/business-os/startup-baselines/TEST/2026-02-12-assessment-intake-packet.user.md",
    );
    const seedOnceAfter = await readFile(
      "docs/business-os/strategy/TEST/assessment/current-problem-framing.user.md",
    );

    expect(refreshedIntake).toContain("| Business name | Facilella | DEC-TEST-NAME-01 |");
    expect(refreshedIntake).toContain(
      "| Business name status | confirmed - selected on 2026-02-26; facilella.com registered | DEC-TEST-NAME-01 |",
    );
    expect(refreshedIntake).toContain(
      "- Naming: confirmed - Facilella selected on 2026-02-26; facilella.com registered (DEC-TEST-NAME-01).",
    );
    expect(refreshedIntake).toContain(
      "| Naming confirmed as Facilella; reassess only if legal/domain conflict appears pre-launch | DEC-TEST-NAME-01 | Confirmed name decision recorded on 2026-02-26; facilella.com registered | High |",
    );
    expect(refreshedIntake).toContain("Updated: 2026-03-09");
    expect(refreshedIntake).toContain("Last-reviewed: 2026-03-09");
    expect(seedOnceAfter).toBe(seedOnceBefore);
  });

  it("TC-02: unrelated changed files return no-op candidate set", async () => {
    await writeFile(
      "docs/business-os/startup-baselines/TEST/2026-02-12-assessment-intake-packet.user.md",
      intakePacketFixture,
    );

    const actions = runAssessmentPostBuildRefresh({
      rootDir: tmpDir,
      changedFiles: [
        "docs/business-os/strategy/TEST/assessment/current-problem-framing.user.md",
      ],
      today: "2026-03-09",
    });

    expect(actions).toEqual([]);
  });

  it("TC-03: repeated run is idempotent after the intake matches the decision", async () => {
    await writeFile(
      "docs/business-os/startup-baselines/TEST/2026-02-12-assessment-intake-packet.user.md",
      intakePacketFixture,
    );
    await writeFile(
      "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      nameDecisionFixture,
    );

    const firstActions = runAssessmentPostBuildRefresh({
      rootDir: tmpDir,
      changedFiles: [
        "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      ],
      today: "2026-03-09",
    });
    const secondActions = runAssessmentPostBuildRefresh({
      rootDir: tmpDir,
      changedFiles: [
        "docs/business-os/strategy/TEST/assessment/DEC-TEST-NAME-01.user.md",
      ],
      today: "2026-03-09",
    });

    expect(firstActions[0]?.status).toBe("applied");
    expect(secondActions[0]).toMatchObject({
      business: "TEST",
      status: "noop",
      reason: "intake_already_matches_decision",
    });
  });
});
