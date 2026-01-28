/**
 * Business Plan presentation view
 *
 * Renders business plan markdown in read-only presentation format
 */

import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import matter from "gray-matter";
import path from "path";

import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { ChangeRequestButton } from "@/components/change-request/ChangeRequestButton";

interface PlanPageProps {
  params: Promise<{
    businessCode: string;
  }>;
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { businessCode } = await params;
  const repoRoot = process.cwd();
  const planPath = path.join(
    repoRoot,
    "docs/business-os/strategy",
    businessCode,
    "plan.user.md"
  );

  // Read plan file
  let planContent: string;
  let frontmatter: Record<string, unknown>;

  try {
    const fileContent = await fs.readFile(planPath, "utf-8");
    const parsed = matter(fileContent);
    planContent = parsed.content;
    frontmatter = parsed.data;
  } catch {
    // Plan not found
    notFound();
  }

  const lastReviewed =
    frontmatter["Last-reviewed"] &&
    typeof frontmatter["Last-reviewed"] === "string"
      ? frontmatter["Last-reviewed"]
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {businessCode} Business Plan
            </h1>
            <ChangeRequestButton
              documentType="plan"
              documentPath={`docs/business-os/strategy/${businessCode}/plan.user.md`}
              businessCode={businessCode}
            />
          </div>
          {lastReviewed && (
            <p className="text-sm text-gray-600">
              Last reviewed: {lastReviewed}
            </p>
          )}
        </div>

        {/* Plan content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <MarkdownRenderer content={planContent} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>
            This is a read-only view. To request changes, use the &ldquo;Request
            Change&rdquo; button.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PlanPageProps) {
  const { businessCode } = await params;

  return {
    title: `${businessCode} Business Plan | Business OS`,
    description: `Business plan for ${businessCode}`,
  };
}
