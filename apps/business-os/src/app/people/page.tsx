/**
 * People document presentation view
 *
 * Renders people/team information in read-only presentation format
 */

import { notFound } from "next/navigation";
import matter from "gray-matter";
import path from "path";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { ChangeRequestButton } from "@/components/change-request/ChangeRequestButton";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { readFileWithinRoot } from "@/lib/safe-fs";

export default async function PeoplePage() {
  const t = await getServerTranslations("en");
  const repoRoot = process.cwd();
  const peoplePath = path.join(
    repoRoot,
    "docs/business-os/people/people.user.md"
  );

  // Read people file
  let peopleContent: string;
  let frontmatter: Record<string, unknown>;

  try {
    const fileContent = await readFileWithinRoot(
      repoRoot,
      peoplePath,
      "utf-8"
    );
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
    <div className="bg-surface-1" style={{ minHeight: "100svh" }}>
      <div className="mx-auto w-full px-4 py-8" style={{ maxWidth: "64rem" }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              {t("businessOs.pages.people.title")}
            </h1>
            <ChangeRequestButton
              documentType="people"
              // i18n-exempt -- BOS-101 document path constant [ttl=2026-03-31]
              documentPath="docs/business-os/people/people.user.md"
            />
          </div>
          {lastReviewed && (
            <p className="text-sm text-muted-foreground">
              {t("businessOs.pages.lastReviewed", { date: lastReviewed })}
            </p>
          )}
        </div>

        {/* People content */}
        <div className="bg-card rounded-lg shadow-sm border border-border-2 p-8">
          <MarkdownRenderer content={peopleContent} />
        </div>

        {/* Footer */}
        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>{t("businessOs.pages.footerReadOnly")}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata() {
  const t = await getServerTranslations("en");
  return {
    title: t("businessOs.pages.people.metaTitle"),
    description: t("businessOs.pages.people.metaDescription"),
  };
}
