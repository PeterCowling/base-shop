/** @jest-environment node */

import path from "node:path";

import { runDeadCodeAudit } from "../src/quality/dead-code-audit";

const repoRoot = path.resolve(__dirname, "..", "..");

describe("dead-code-audit safeguards", () => {
  it("uses reception navConfig.ts as the navigation source of truth", () => {
    const findings = runDeadCodeAudit({
      apps: ["reception"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/reception/src/app/bar/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("does not flag reception hidden routes that are referenced in production code", () => {
    const findings = runDeadCodeAudit({
      apps: ["reception"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/reception/src/app/doc-insert/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("accepts brikette internal segments even when public slugs differ", () => {
    const findings = runDeadCodeAudit({
      apps: ["brikette"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/brikette/src/app/[lang]/assistance/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("normalizes prime route groups before checking page reachability", () => {
    const findings = runDeadCodeAudit({
      apps: ["prime"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/app/(guarded)/activities/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("does not flag intentionally hidden prime routes", () => {
    const findings = runDeadCodeAudit({
      apps: ["prime"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/app/owner/scorecard/page.tsx"
      ),
    ).toBeUndefined();
    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/app/(guarded)/language-selector/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("does not flag prime redirect alias pages as dead code", () => {
    const findings = runDeadCodeAudit({
      apps: ["prime"],
      categories: ["pages"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/app/(guarded)/chat/activities/page.tsx"
      ),
    ).toBeUndefined();
    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/app/(guarded)/chat/activities/manage/page.tsx"
      ),
    ).toBeUndefined();
  });

  it("counts prime functions imports before flagging shared src modules", () => {
    const findings = runDeadCodeAudit({
      apps: ["prime"],
      categories: ["exports"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/prime/src/lib/messaging/queue-processor.ts"
      ),
    ).toBeUndefined();
  });

  it("resolves relative imports before flagging exports", () => {
    const findings = runDeadCodeAudit({
      apps: ["brikette"],
      categories: ["exports"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.filePath === "apps/brikette/src/utils/transliterate-guide-label.ts"
      ),
    ).toBeUndefined();
  });

  it("does not treat documented or runtime-used feature flags as dead code", () => {
    const findings = runDeadCodeAudit({
      apps: ["brikette"],
      categories: ["flags"],
      format: "json",
      repoRoot,
    });

    expect(
      findings.find((finding) =>
        finding.displayPath === "config/env.ts → OCTORATE_LIVE_AVAILABILITY"
      ),
    ).toBeUndefined();
  });
});
