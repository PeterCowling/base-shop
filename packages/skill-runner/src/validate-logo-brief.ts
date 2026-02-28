import { readFileSync } from "node:fs";

import {
  getFrontmatterString,
  getFrontmatterStringList,
  normalizeNewlines,
  parseFrontmatter,
} from "./markdown.js";

export interface LogoBriefCheckResult {
  checkId: string;
  pass: boolean;
  message: string;
}

export interface LogoBriefValidationResult {
  valid: boolean;
  checks: LogoBriefCheckResult[];
  failures: LogoBriefCheckResult[];
}

const MARK_TYPES = new Set([
  "wordmark",
  "lettermark",
  "symbol + wordmark",
  "abstract mark",
]);

export function validateLogoBriefFile(briefPath: string): LogoBriefValidationResult {
  const markdown = readFileSync(briefPath, "utf8");
  return validateLogoBriefMarkdown(markdown, briefPath);
}

export function validateLogoBriefMarkdown(
  briefMarkdown: string,
  sourcePath?: string,
): LogoBriefValidationResult {
  const normalized = normalizeNewlines(briefMarkdown);
  const parsed = parseFrontmatter(normalized);
  const sections = parseSections(parsed.body);
  const context: ValidationContext = {
    normalized,
    sourcePath,
    frontmatter: parsed.frontmatter,
    sections,
    inputEntries: getFrontmatterStringList(parsed.frontmatter, "Inputs"),
  };

  const checks = LOGO_BRIEF_CHECKS.map((checkFn) => checkFn(context));
  const failures = checks.filter((check) => !check.pass);
  return {
    valid: failures.length === 0,
    checks,
    failures,
  };
}

interface ValidationContext {
  normalized: string;
  sourcePath?: string;
  frontmatter: Record<string, unknown>;
  sections: Array<{ heading: string; body: string }>;
  inputEntries: string[];
}

const LOGO_BRIEF_CHECKS: Array<(context: ValidationContext) => LogoBriefCheckResult> = [
  checkSectionsCount,
  checkMarkType,
  checkIconDerivative,
  checkColorSection,
  checkColorFormats,
  checkTypography,
  checkDeliverables,
  checkUseCases,
  checkForbiddenTerritory,
  checkReferences,
  checkFrontmatterRequired,
  checkInputsFormat,
  checkProductNamingInput,
  checkAiPrompt,
  checkPathConvention,
  checkDeploymentSignal,
];

function checkSectionsCount(context: ValidationContext): LogoBriefCheckResult {
  const count = context.sections.length;
  return {
    checkId: "LB-01",
    pass: count >= 9,
    message: count >= 9 ? "Contains at least 9 sections." : `Found ${count} sections; expected >=9.`,
  };
}

function checkMarkType(context: ValidationContext): LogoBriefCheckResult {
  const markTypeSection = findSectionBody(context.sections, /mark type/i);
  const markTypeMatch = markTypeSection?.match(
    /\b(wordmark|lettermark|symbol \+ wordmark|abstract mark)\b/i,
  );
  return {
    checkId: "LB-02",
    pass: Boolean(markTypeMatch && MARK_TYPES.has(markTypeMatch[1].toLowerCase())),
    message: markTypeMatch
      ? `Mark type found: ${markTypeMatch[1]}.`
      : "Missing valid mark type (wordmark, lettermark, symbol + wordmark, abstract mark).",
  };
}

function checkIconDerivative(context: ValidationContext): LogoBriefCheckResult {
  const markTypeSection = findSectionBody(context.sections, /mark type/i);
  const pass = Boolean(markTypeSection && /icon-only derivative/i.test(markTypeSection));
  return {
    checkId: "LB-03",
    pass,
    message: pass
      ? "Icon-only derivative reference found."
      : "Missing Mark Type section or icon-only derivative note.",
  };
}

function checkColorSection(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /colou?r specification/i);
  return {
    checkId: "LB-04",
    pass: Boolean(section),
    message: section
      ? "Colour/Color Specification section present."
      : "Missing Colour Specification section.",
  };
}

function checkColorFormats(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /colou?r specification/i) ?? "";
  const hasUpperHex = /#[A-F0-9]{6}\b/.test(section);
  const hasLowerHex = /#[a-f0-9]{6}\b/.test(section);
  const hasHslFormat = /\b\d{1,3}\s+\d{1,3}%\s+\d{1,3}%\b/.test(section);
  const pass =
    section.length > 0 &&
    hasHslFormat &&
    (hasUpperHex || /hex:\s*designer to derive/i.test(section)) &&
    !hasLowerHex;
  return {
    checkId: "LB-05",
    pass,
    message: section.length > 0
      ? "HSL/hex formatting check completed."
      : "Cannot verify HSL/hex formatting without Colour Specification section.",
  };
}

function checkTypography(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /typography specification/i) ?? "";
  const pass =
    section.length > 0 &&
    (/heading font/i.test(section) || /\btypography:\s*tbd\b/i.test(section)) &&
    /letterform/i.test(section) &&
    /license/i.test(section);
  return {
    checkId: "LB-06",
    pass,
    message: pass
      ? "Typography section includes heading font/TBD note, modification policy, and license note."
      : "Typography section is incomplete.",
  };
}

function checkDeliverables(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /deliverables and lockups/i) ?? "";
  const pass = section.length > 0 && /svg/i.test(section) && /icon-only/i.test(section);
  return {
    checkId: "LB-07",
    pass,
    message: pass
      ? "Deliverables and lockups section includes minimum set markers."
      : "Deliverables and lockups section missing minimum set details.",
  };
}

function checkUseCases(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /use case/i) ?? "";
  const count = countListItems(section);
  const pass =
    section.length > 0 &&
    count >= 4 &&
    /social/i.test(section) &&
    /website header/i.test(section) &&
    /email header/i.test(section);
  return {
    checkId: "LB-08",
    pass,
    message: pass
      ? `Use Case section has ${count} entries with required channels.`
      : `Use Case section failed requirements (count=${count}).`,
  };
}

function checkForbiddenTerritory(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /forbidden territory/i) ?? "";
  const count = countListItems(section);
  const pass = section.length > 0 && count >= 2;
  return {
    checkId: "LB-09",
    pass,
    message: pass
      ? `Forbidden Territory has ${count} constraint items.`
      : "Missing Forbidden Territory section.",
  };
}

function checkReferences(context: ValidationContext): LogoBriefCheckResult {
  const section = findSectionBody(context.sections, /reference inspirations?/i) ?? "";
  const count = countListItems(section);
  const pass = (section.length > 0 && count >= 2) || /operator should provide/i.test(section);
  return {
    checkId: "LB-10",
    pass,
    message: pass
      ? "Reference inspirations requirement satisfied."
      : "Reference inspirations section missing required entries.",
  };
}

function checkFrontmatterRequired(context: ValidationContext): LogoBriefCheckResult {
  const requiredFrontmatter = [
    "Type",
    "Stage",
    "Business-Unit",
    "Business-Name",
    "Status",
    "Created",
    "Updated",
    "Owner",
    "Inputs",
  ];
  const missingFields = requiredFrontmatter.filter(
    (field) => !getFrontmatterString(context.frontmatter, field),
  );
  return {
    checkId: "LB-11",
    pass: missingFields.length === 0,
    message:
      missingFields.length === 0
        ? "Required frontmatter fields are present."
        : `Missing frontmatter fields: ${missingFields.join(", ")}`,
  };
}

function checkInputsFormat(context: ValidationContext): LogoBriefCheckResult {
  const pass =
    context.inputEntries.length > 0 &&
    context.inputEntries.every(
      (entry) => /\.md\b/i.test(entry) || /\.user\.md\b/i.test(entry),
    );
  return {
    checkId: "LB-12",
    pass,
    message: pass
      ? "Inputs frontmatter contains source filenames."
      : "Inputs frontmatter missing or does not contain source filenames.",
  };
}

function checkProductNamingInput(context: ValidationContext): LogoBriefCheckResult {
  return {
    checkId: "LB-13",
    pass: context.inputEntries.some((entry) => /product-naming\.user\.md$/i.test(entry)),
    message: "Business-name provenance check: expected product naming document in Inputs.",
  };
}

function checkAiPrompt(context: ValidationContext): LogoBriefCheckResult {
  const promptSection = findSectionBody(context.sections, /ai mock-?up prompt/i);
  const promptChecks = validateAiPromptSection(promptSection ?? "");
  return {
    checkId: "LB-14",
    pass: promptChecks.pass,
    message: promptChecks.message,
  };
}

function checkPathConvention(context: ValidationContext): LogoBriefCheckResult {
  const pathPass = Boolean(
    context.sourcePath && /-logo-brief\.user\.md$/i.test(context.sourcePath),
  );
  return {
    checkId: "LB-15",
    pass: pathPass || !context.sourcePath,
    message: context.sourcePath
      ? pathPass
        ? "Artifact path matches *-logo-brief.user.md."
        : `Unexpected artifact path: ${context.sourcePath}`
      : "Path check skipped (source path not provided).",
  };
}

function checkDeploymentSignal(context: ValidationContext): LogoBriefCheckResult {
  const pass =
    /logo assets deployed/i.test(context.normalized) ||
    /logo assets not deployed/i.test(context.normalized);
  return {
    checkId: "LB-16",
    pass,
    message: pass
      ? "Deployment attempt signal found."
      : "Missing deployment attempt signal (expected deployed/not deployed note).",
  };
}

function parseSections(body: string): Array<{ heading: string; body: string }> {
  const lines = normalizeNewlines(body).split("\n");
  const sections: Array<{ heading: string; body: string }> = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = (): void => {
    if (!heading) {
      return;
    }
    sections.push({ heading, body: buffer.join("\n").trim() });
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (!match) {
      if (heading) {
        buffer.push(line);
      }
      continue;
    }
    flush();
    heading = match[1].trim();
    buffer = [];
  }
  flush();
  return sections;
}

function findSectionBody(
  sections: Array<{ heading: string; body: string }>,
  headingPattern: RegExp,
): string | null {
  const found = sections.find((section) => headingPattern.test(section.heading));
  return found ? found.body : null;
}

function countListItems(sectionBody: string): number {
  return normalizeNewlines(sectionBody)
    .split("\n")
    .filter((line) => /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line)).length;
}

function validateAiPromptSection(sectionBody: string): { pass: boolean; message: string } {
  const codeBlocks = [...sectionBody.matchAll(/```(?:text|txt|md|markdown)?\n([\s\S]*?)```/g)];
  if (codeBlocks.length !== 1) {
    return {
      pass: false,
      message: "AI prompt section must contain exactly one code block.",
    };
  }

  const prompt = codeBlocks[0][1].trim();
  const words = prompt.split(/\s+/).filter(Boolean);
  const startsGenerate = /^generate\b/i.test(prompt);
  const hasFourCompositions =
    /\b1\./.test(prompt) && /\b2\./.test(prompt) && /\b3\./.test(prompt) && /\b4\./.test(prompt);
  const hasRationaleLine = /after each image,\s*write 2[–-]3 sentences/i.test(prompt);
  const hasHex = /#[A-F0-9]{6}\b/.test(prompt);
  const hasNegativeNo = /\bno\s+[a-z]/i.test(prompt);
  const avoidsTokenNames = !/--color-/i.test(prompt);
  const avoidsFontNameWord = !/\bfont\b/i.test(prompt);

  const pass =
    startsGenerate &&
    words.length <= 200 &&
    hasFourCompositions &&
    hasRationaleLine &&
    hasHex &&
    hasNegativeNo &&
    avoidsTokenNames &&
    avoidsFontNameWord;

  return {
    pass,
    message: pass
      ? "AI mock-up prompt passes deterministic quality checks."
      : "AI mock-up prompt failed one or more format/content checks.",
  };
}
