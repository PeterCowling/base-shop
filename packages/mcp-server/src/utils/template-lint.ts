export type EmailTemplate = {
  subject: string;
  body: string;
  category: string;
};

export type TemplateLintIssue = {
  subject: string;
  code: "broken_link" | "placeholder" | "policy_mismatch";
  details: string;
};

const URL_REGEX = /https?:\/\/[^\s)]+/g;
const PLACEHOLDER_REGEX = /\{[^}]+\}/g;

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
