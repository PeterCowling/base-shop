import "server-only";

import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

export interface SeoAuditEntry {
  timestamp: string;
  score: number;
  recommendations?: string[];
}

type SeoAuditRepo = {
  readSeoAudits(shop: string): Promise<SeoAuditEntry[]>;
  appendSeoAudit(shop: string, entry: SeoAuditEntry): Promise<void>;
};

let repoPromise: Promise<SeoAuditRepo> | undefined;

async function getRepo(): Promise<SeoAuditRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<SeoAuditRepo>(
      () => (prisma as { seoAudit?: unknown }).seoAudit,
      () =>
        import("./seoAudit.prisma.server") as unknown as Promise<SeoAuditRepo>,
      () =>
        import("./seoAudit.json.server") as unknown as Promise<SeoAuditRepo>,
      { backendEnvVar: "SEO_AUDIT_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readSeoAudits(shop: string): Promise<SeoAuditEntry[]> {
  const repo = await getRepo();
  return repo.readSeoAudits(shop);
}

export async function appendSeoAudit(
  shop: string,
  entry: SeoAuditEntry,
): Promise<void> {
  const repo = await getRepo();
  return repo.appendSeoAudit(shop, entry);
}
