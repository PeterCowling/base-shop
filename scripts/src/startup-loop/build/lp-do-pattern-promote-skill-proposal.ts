/**
 * lp-do-pattern-promote-skill-proposal.ts
 *
 * Reads pattern-reflection artifacts, filters entries with
 * routing_target === "skill_proposal", and scaffolds SKILL.md
 * templates in the output directory for operator review.
 *
 * Imports shared parser from lp-do-pattern-promote-loop-update.ts.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
  filterByRoutingTarget,
  parsePatternReflectionEntries,
} from "./lp-do-pattern-promote-loop-update.js";
import type {
  PatternEntry,
  PromoteOptions,
  PromotionResult,
} from "./lp-do-pattern-promote-loop-update.js";

/* ------------------------------------------------------------------ */
/*  Skill name derivation                                              */
/* ------------------------------------------------------------------ */

export function deriveSkillName(summary: string): string {
  const kebab = summary
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/g, "");
  return kebab || "unnamed-skill";
}

/* ------------------------------------------------------------------ */
/*  Scaffold generation                                                */
/* ------------------------------------------------------------------ */

export function generateSkillScaffold(
  entry: PatternEntry,
): string {
  const skillName = deriveSkillName(entry.pattern_summary);

  const evidenceList =
    entry.evidence_refs.length > 0
      ? entry.evidence_refs.map((r) => `- \`${r}\``).join("\n")
      : "- None provided";

  return [
    "---",
    `name: ${skillName}`,
    `description: "${entry.pattern_summary}"`,
    "---",
    "",
    `# ${entry.pattern_summary}`,
    "",
    "<!-- Scaffolded by lp-do-pattern-promote-skill-proposal from pattern-reflection entry. -->",
    "<!-- Operator: review and refine before use. -->",
    "",
    "## Quick Description",
    "",
    `This skill addresses: ${entry.pattern_summary}`,
    "",
    `- **Pattern category:** ${entry.category}`,
    `- **Occurrence count:** ${entry.occurrence_count}`,
    "",
    "## Invocation",
    "",
    "```bash",
    `/${skillName} [options]`,
    "```",
    "",
    "## Operating Mode",
    "",
    "**TODO** — define operating mode (e.g., ANALYSIS ONLY, BUILD ONLY, etc.)",
    "",
    "## Global Invariants",
    "",
    "### Allowed actions",
    "",
    "- TODO",
    "",
    "### Prohibited actions",
    "",
    "- TODO",
    "",
    "## Workflow",
    "",
    "### Phase 1: TODO",
    "",
    "- TODO",
    "",
    "## Evidence References",
    "",
    evidenceList,
    "",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Promotion logic                                                    */
/* ------------------------------------------------------------------ */

export function promoteSkillProposalEntries(
  options: PromoteOptions,
): PromotionResult {
  const { reflectionPath, outputDir, dryRun } = options;

  let content: string;
  try {
    content = fs.readFileSync(reflectionPath, "utf-8");
  } catch (err) {
    process.stderr.write(
      `[promote-skill] cannot read ${reflectionPath}: ${err}\n`,
    );
    return { processed: 0, matched: 0, drafted: 0, skipped: 0, drafts: [] };
  }

  const allEntries = parsePatternReflectionEntries(content);
  const matched = filterByRoutingTarget(allEntries, "skill_proposal");

  process.stderr.write(
    `[promote-skill] ${allEntries.length} entries parsed, ${matched.length} with routing_target=skill_proposal\n`,
  );

  const drafts: PromotionResult["drafts"] = [];
  const usedNames = new Set<string>();
  let skipped = 0;

  for (const entry of matched) {
    let skillName = deriveSkillName(entry.pattern_summary);

    // Handle duplicate names
    if (usedNames.has(skillName)) {
      let suffix = 2;
      while (usedNames.has(`${skillName}-${suffix}`)) suffix++;
      skillName = `${skillName}-${suffix}`;
    }
    usedNames.add(skillName);

    const scaffold = generateSkillScaffold(entry);
    const filename = `${skillName}/SKILL.md`;

    drafts.push({
      filename,
      content: scaffold,
      entry,
      targetDoc: `.claude/skills/${skillName}/SKILL.md`,
    });

    if (dryRun) {
      process.stdout.write(
        `[dry-run] would write: ${path.join(outputDir, filename)}\n`,
      );
      process.stdout.write(`  skill_name: ${skillName}\n`);
      process.stdout.write(`  pattern: ${entry.pattern_summary}\n\n`);
    } else {
      const outDir = path.join(outputDir, skillName);
      const outPath = path.join(outDir, "SKILL.md");
      try {
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, scaffold, "utf-8");
        process.stdout.write(`[promote-skill] wrote: ${outPath}\n`);
      } catch (err) {
        process.stderr.write(
          `[promote-skill] failed to write ${outPath}: ${err}\n`,
        );
        skipped++;
      }
    }
  }

  const drafted = dryRun ? 0 : drafts.length - skipped;
  process.stderr.write(
    `[promote-skill] summary: ${allEntries.length} processed, ${matched.length} matched, ${drafted} drafted, ${skipped} skipped\n`,
  );

  return {
    processed: allEntries.length,
    matched: matched.length,
    drafted,
    skipped,
    drafts,
  };
}

/* ------------------------------------------------------------------ */
/*  CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(
  argv: string[],
): PromoteOptions {
  let reflectionPath = "";
  let outputDir = "";
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--reflection-path" && i + 1 < argv.length)
      reflectionPath = argv[++i];
    else if (a === "--output-dir" && i + 1 < argv.length)
      outputDir = argv[++i];
    else if (a === "--dry-run") dryRun = true;
  }

  if (!reflectionPath || !outputDir) {
    process.stderr.write(
      "Usage: lp-do-pattern-promote-skill-proposal --reflection-path <path> --output-dir <dir> [--dry-run]\n",
    );
    process.exit(1);
  }

  return { reflectionPath, outputDir, dryRun };
}

export function main(): void {
  const options = parseArgs(process.argv);
  promoteSkillProposalEntries(options);
}

if (process.argv[1]?.includes("lp-do-pattern-promote-skill-proposal")) {
  main();
}
