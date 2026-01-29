/**
 * Business Plan presentation view
 *
 * Renders business plan markdown in read-only presentation format
 */

import { notFound } from "next/navigation";
import matter from "gray-matter";
import path from "path";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import { ChangeRequestButton } from "@/components/change-request/ChangeRequestButton";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { readFileWithinRoot } from "@/lib/safe-fs";

interface PlanPageProps {
  params: Promise<{
    businessCode: string;
  }>;
}

export default async function PlanPage({ params }: PlanPageProps) {
  const t = await getServerTranslations("en");
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
    const fileContent = await readFileWithinRoot(
      repoRoot,
      planPath,
      "utf-8"
    );
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

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Plans", href: "/" },
    { label: `${businessCode} Plan` },
  ];

  return (
    <div className="bg-surface-1" style={{ minHeight: "100svh" }}>
      <div className="mx-auto w-full px-4 py-8" style={{ maxWidth: "64rem" }}>
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              {t("businessOs.pages.plans.title", { businessCode })}
            </h1>
            <ChangeRequestButton
              documentType="plan"
              // i18n-exempt -- BOS-101 document path constant [ttl=2026-03-31]
              documentPath={`docs/business-os/strategy/${businessCode}/plan.user.md`}
              businessCode={businessCode}
            />
          </div>
          {lastReviewed && (
            <p className="text-sm text-muted-foreground">
              {t("businessOs.pages.lastReviewed", { date: lastReviewed })}
            </p>
          )}
        </div>

        {/* Plan content */}
        <div className="bg-card rounded-lg shadow-sm border border-border-2 p-8">
          <MarkdownRenderer content={planContent} />
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
export async function generateMetadata({ params }: PlanPageProps) {
  const t = await getServerTranslations("en");
  const { businessCode } = await params;

  return {
    title: t("businessOs.pages.plans.metaTitle", { businessCode }),
    description: t("businessOs.pages.plans.metaDescription", { businessCode }),
  };
}
