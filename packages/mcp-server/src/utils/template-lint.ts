export type EmailTemplate = {
  subject: string;
  body: string;
  category: string;
};

export type TemplateLintIssue = {
  subject: string;
  code: "broken_link" | "placeholder" | "policy_mismatch" | "here_without_url";
  details: string;
};

const URL_REGEX = /https?:\/\/[^\s)]+/g;
/**
 * Matches unfilled placeholders in three common forms:
 *   {var}        — single-brace (original)
 *   {{var}}      — double-brace (Handlebars-style)
 *   [PLACEHOLDER] — bracket-upper convention
 */
const PLACEHOLDER_REGEX = /\{\{[^}]+\}\}|\{[^}]+\}|\[[A-Z][A-Z0-9_\s]*\]/g;

/**
 * Sentence-level pattern: a sentence that contains "here" or "click here" as a
 * link anchor but does not contain an http/https URL.
 */
function findHereWithoutUrl(text: string): string[] {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const issues: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (/\bclick\s+here\b|\bfind.*\bhere\b|\bsee.*\bhere\b|\bprocess\s+here\b/.test(lower)) {
      const urlRegexLocal = /https?:\/\/[^\s)]+/;
      if (!urlRegexLocal.test(sentence)) {
        issues.push(sentence.trim());
      }
    }
  }
  return issues;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "your",
  "you",
  "our",
  "are",
  "was",
  "were",
  "from",
  "into",
  "them",
  "they",
  "their",
  "about",
  "will",
  "can",
  "cannot",
  "cant",
  "have",
  "has",
  "been",
  "does",
  "doesnt",
  "dont",
  "should",
  "must",
  "please",
]);

export function extractLinks(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((link) => link.replace(/[,.;]+$/, ""))));
}

export function findPlaceholders(text: string): string[] {
  return text.match(PLACEHOLDER_REGEX) ?? [];
}

export function buildPolicyKeywordSet(entries: string[]): Set<string> {
  const keywords = new Set<string>();
  for (const entry of entries) {
    const tokens = entry
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token));
    for (const token of tokens) {
      keywords.add(token);
    }
  }
  return keywords;
}

function hasPolicyKeyword(text: string, keywords: Set<string>): boolean {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    if (lower.includes(keyword)) return true;
  }
  return false;
}

/**
 * Synchronous lint pass: checks placeholders and here-without-URL issues.
 * Does not perform live link checks. Suitable for CI template validation.
 */
export function lintTemplatesSync(
  templates: EmailTemplate[],
  options?: { policyKeywords?: Set<string> }
): TemplateLintIssue[] {
  const issues: TemplateLintIssue[] = [];
  const policyKeywords = options?.policyKeywords ?? new Set<string>();

  for (const template of templates) {
    const placeholders = findPlaceholders(template.body);
    for (const placeholder of placeholders) {
      issues.push({
        subject: template.subject,
        code: "placeholder",
        details: `Unfilled placeholder: ${placeholder}`,
      });
    }

    const hereIssues = findHereWithoutUrl(template.body);
    for (const sentence of hereIssues) {
      issues.push({
        subject: template.subject,
        code: "here_without_url",
        details: `Template uses 'here' as link anchor without a URL: "${sentence}"`,
      });
    }

    if (template.category === "policies" && policyKeywords.size > 0) {
      const text = `${template.subject}\n${template.body}`;
      if (!hasPolicyKeyword(text, policyKeywords)) {
        issues.push({
          subject: template.subject,
          code: "policy_mismatch",
          details: "Policy template missing any known policy keywords.",
        });
      }
    }
  }

  return issues;
}

export async function lintTemplates(
  templates: EmailTemplate[],
  options: {
    policyKeywords: Set<string>;
    checkLink: (url: string) => Promise<{ ok: boolean; status?: number }>;
  }
): Promise<TemplateLintIssue[]> {
  const issues: TemplateLintIssue[] = [];

  for (const template of templates) {
    const placeholders = findPlaceholders(template.body);
    for (const placeholder of placeholders) {
      issues.push({
        subject: template.subject,
        code: "placeholder",
        details: `Unfilled placeholder: ${placeholder}`,
      });
    }

    const hereIssues = findHereWithoutUrl(template.body);
    for (const sentence of hereIssues) {
      issues.push({
        subject: template.subject,
        code: "here_without_url",
        details: `Template uses 'here' as link anchor without a URL: "${sentence}"`,
      });
    }

    const links = extractLinks(`${template.subject}\n${template.body}`);
    for (const link of links) {
      const result = await options.checkLink(link);
      if (!result.ok) {
        issues.push({
          subject: template.subject,
          code: "broken_link",
          details: `Link failed (${result.status ?? "unknown"}): ${link}`,
        });
      }
    }

    if (template.category === "policies") {
      const text = `${template.subject}\n${template.body}`;
      if (!hasPolicyKeyword(text, options.policyKeywords)) {
        issues.push({
          subject: template.subject,
          code: "policy_mismatch",
          details: "Policy template missing any known policy keywords.",
        });
      }
    }
  }

  return issues;
}

/** Separate issues into hard failures and soft warnings (broken links). */
export function partitionIssues(issues: TemplateLintIssue[]): {
  hard: TemplateLintIssue[];
  warnings: TemplateLintIssue[];
} {
  const hard: TemplateLintIssue[] = [];
  const warnings: TemplateLintIssue[] = [];
  for (const issue of issues) {
    if (issue.code === "broken_link") {
      warnings.push(issue);
    } else {
      hard.push(issue);
    }
  }
  return { hard, warnings };
}
