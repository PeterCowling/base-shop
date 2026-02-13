export interface RobotsConfig {
  siteUrl: string;
  allowIndexing?: boolean;
  sitemapPaths?: string[];
  disallowPaths?: string[];
  aiBotRules?: Array<{ userAgent: string; allow: boolean }>;
}

export function buildRobotsTxt(_config: RobotsConfig): string {
  throw new Error("Not implemented");
}
