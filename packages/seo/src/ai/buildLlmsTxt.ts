export interface LlmsTxtConfig {
  siteName: string;
  description: string;
  sources: Array<{ title: string; url: string; description?: string }>;
  contextSections?: Array<{ heading: string; content: string }>;
}

/**
 * Build an llms.txt file content string.
 * Format: Markdown with H1 title, tagline, machine-readable sources, and optional context.
 */
export function buildLlmsTxt(config: LlmsTxtConfig): string {
  const lines: string[] = [];

  lines.push(`# ${config.siteName}`);
  lines.push(`> ${config.description}`);
  lines.push("");
  // i18n-exempt -- SEO-05 llms.txt markdown heading convention, not user-facing copy [ttl=2027-12-31]
  lines.push("## Machine-readable sources");

  for (const source of config.sources) {
    if (source.description) {
      lines.push(`- [${source.title}](${source.url}) \u2014 ${source.description}`);
    } else {
      lines.push(`- [${source.title}](${source.url})`);
    }
  }

  if (config.contextSections) {
    for (const section of config.contextSections) {
      lines.push("");
      lines.push(`## ${section.heading}`);
      lines.push(section.content);
    }
  }

  lines.push("");
  return lines.join("\n");
}
