// i18n-exempt -- BOS-104 [ttl=2026-12-31] Internal workflow viewer copy
/* eslint-disable ds/no-hardcoded-copy -- BOS-104 [ttl=2026-12-31] Internal workflow viewer copy */
import { notFound } from "next/navigation";
import matter from "gray-matter";
import path from "path";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getRepoRoot } from "@/lib/get-repo-root";
import { readFileWithinRoot } from "@/lib/safe-fs";

function resolveWorkflowHtmlPathFromPointer(frontmatter: Record<string, unknown>): string {
  const sourceBaseline =
    typeof frontmatter["Source-Baseline"] === "string"
      ? frontmatter["Source-Baseline"]
      : null;

  if (sourceBaseline && sourceBaseline.endsWith(".user.md")) {
    return sourceBaseline.replace(/\.user\.md$/u, ".user.html");
  }

  // i18n-exempt -- BOS-104 deterministic fallback path for workflow viewer [ttl=2026-12-31]
  return "docs/business-os/platform-capability/2026-02-12-platform-capability-baseline.user.html";
}

export default async function WorkflowsPage() {
  const repoRoot = getRepoRoot();
  const pointerPath = path.join(repoRoot, "docs/business-os/platform-capability/latest.user.md");

  let pointerFrontmatter: Record<string, unknown>;

  try {
    const pointerContent = await readFileWithinRoot(repoRoot, pointerPath, "utf-8");
    pointerFrontmatter = matter(pointerContent as string).data;
  } catch {
    notFound();
  }

  const workflowHtmlRelativePath = resolveWorkflowHtmlPathFromPointer(pointerFrontmatter);
  const workflowHtmlPath = path.join(repoRoot, workflowHtmlRelativePath);

  let workflowHtml: string;
  try {
    workflowHtml = (await readFileWithinRoot(repoRoot, workflowHtmlPath, "utf-8")) as string;
  } catch {
    notFound();
  }

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Workflows" }];

  return (
    <div className="bg-surface-1" style={{ minHeight: "100svh" }}>
      <div className="mx-auto w-full px-4 py-8" style={{ maxWidth: "80rem" }}>
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Platform capability and process workflow documents rendered for browser viewing.
          </p>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            Source: {workflowHtmlRelativePath}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border-2 p-3">
          <iframe
            title="Platform Capability Baseline Workflow"
            srcDoc={workflowHtml}
            className="w-full aspect-video rounded-md border border-border-2 bg-white"
          />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Workflows | Business OS",
  description: "Workflow document area for Business OS.",
};
/* eslint-enable ds/no-hardcoded-copy */
