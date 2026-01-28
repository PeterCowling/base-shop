/**
 * People document presentation view
 *
 * Renders people/team information in read-only presentation format
 */

import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import matter from "gray-matter";
import path from "path";

import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { ChangeRequestButton } from "@/components/change-request/ChangeRequestButton";

export default async function PeoplePage() {
  const repoRoot = process.cwd();
  const peoplePath = path.join(
    repoRoot,
    "docs/business-os/people/people.user.md"
  );

  // Read people file
  let peopleContent: string;
  let frontmatter: Record<string, unknown>;

  try {
    const fileContent = await fs.readFile(peoplePath, "utf-8");
    const parsed = matter(fileContent);
    peopleContent = parsed.content;
    frontmatter = parsed.data;
  } catch {
    // People doc not found
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
            <h1 className="text-3xl font-bold text-gray-900">People & Team</h1>
            <ChangeRequestButton
              documentType="people"
              documentPath="docs/business-os/people/people.user.md"
            />
          </div>
          {lastReviewed && (
            <p className="text-sm text-gray-600">Last reviewed: {lastReviewed}</p>
          )}
        </div>

        {/* People content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <MarkdownRenderer content={peopleContent} />
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
export async function generateMetadata() {
  return {
    title: "People & Team | Business OS",
    description: "Team roles, responsibilities, and capabilities",
  };
}
