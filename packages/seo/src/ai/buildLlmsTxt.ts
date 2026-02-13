export interface LlmsTxtConfig {
  siteName: string;
  description: string;
  sources: Array<{ title: string; url: string; description?: string }>;
  contextSections?: Array<{ heading: string; content: string }>;
}

export function buildLlmsTxt(_config: LlmsTxtConfig): string {
  throw new Error("Not implemented");
}
