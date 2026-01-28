"use client";

// src/app/[lang]/draft/DraftDashboardContent.tsx
// Client component for draft dashboard - migrated from routes/guides/draft.index.tsx
/* eslint-disable ds/no-hardcoded-copy -- TECH-DEBT-000 [ttl=2025-12-31] Editorial dashboard copy awaiting i18n coverage */
import { memo, useCallback, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { Section } from "@acme/design-system/atoms";

import { Cluster, Inline, Stack } from "@/components/ui/flex";
import { PREVIEW_TOKEN } from "@/config/env";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { buildGuideEditUrl } from "@/routes/guides/guide-authoring/urls";
import { guideSlug } from "@/routes.guides-helpers";
import {
  buildGuideChecklist,
  type ChecklistSnapshotItem,
  type ChecklistSnapshot,
  guideAreaToSlugKey,
  type GuideManifestEntry,
  GUIDE_STATUS_VALUES,
  listGuideManifestEntries,
  resolveDraftPathSegment,
} from "@/routes/guides/guide-manifest";
import type { GuideSeoTemplateProps } from "@/routes/guides/guide-seo/types";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
};

type DraftGuideSummary = {
  key: GuideSeoTemplateProps["guideKey"];
  slug: string;
  status: GuideManifestEntry["status"];
  areas: GuideManifestEntry["areas"];
  primaryArea: GuideManifestEntry["primaryArea"];
  checklist: ChecklistSnapshot;
  draftPath: string;
};

type DraftGuideStatus = DraftGuideSummary["status"];

const STATUS_LABEL: Record<DraftGuideStatus, string> = {
  draft: "Draft",
  review: "In review",
  live: "Live",
};

const STATUS_CLASS: Record<DraftGuideStatus, string> = {
  draft: "text-brand-terra bg-brand-terra/10 border border-brand-terra/30",
  review: "text-brand-primary bg-brand-primary/10 border border-brand-primary/25",
  live: "text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/25",
};

const AREA_LABELS: Record<GuideManifestEntry["primaryArea"], string> = {
  experience: "Experiences",
  help: "Help centre",
  howToGetHere: "How to get here",
};

function formatOutstandingLabel(item: ChecklistSnapshotItem): string {
  if (item.id === "translations" && item.diagnostics?.translations) {
    const { completeLocales, totalLocales } = item.diagnostics.translations;
    return `Translations: ${completeLocales.length}/${totalLocales} locales`;
  }

  if (item.id === "content" && item.diagnostics?.content) {
    const missing: string[] = [];
    if (!item.diagnostics.content.intro) missing.push("intro");
    if (!item.diagnostics.content.sections) missing.push("sections");
    if (missing.length > 0) return `Content: missing ${missing.join(" + ")}`;
    return "Content: complete";
  }

  if (item.id === "faqs" && item.diagnostics?.faqs) {
    return item.diagnostics.faqs.hasFaqs
      ? `FAQs: ${item.diagnostics.faqs.count} items`
      : "FAQs: missing";
  }

  return item.note ?? item.id;
}

function buildSummary(entry: GuideManifestEntry, lang: AppLanguage): DraftGuideSummary {
  return {
    key: entry.key,
    slug: entry.slug,
    status: entry.status,
    areas: entry.areas,
    primaryArea: entry.primaryArea,
    checklist: buildGuideChecklist(entry, { includeDiagnostics: true, lang }),
    draftPath: resolveDraftPathSegment(entry),
  };
}

type StatusDropdownProps = {
  guideKey: string;
  initialStatus: DraftGuideStatus;
  canEdit: boolean;
};

function StatusDropdown({ guideKey, initialStatus, canEdit }: StatusDropdownProps) {
  const [status, setStatus] = useState<DraftGuideStatus>(initialStatus);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleStatusChange = useCallback(
    async (newStatus: DraftGuideStatus) => {
      if (!canEdit) return;

      setStatus(newStatus);
      setSaveStatus("saving");

      try {
        const response = await fetch(`/api/guides/${guideKey}/manifest`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-preview-token": PREVIEW_TOKEN ?? "",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json() as { ok?: boolean; error?: string };

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Failed to save status");
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        setSaveStatus("error");
        setStatus(initialStatus); // Revert on error
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [canEdit, guideKey, initialStatus]
  );

  if (!canEdit) {
    return (
      <Inline
        as="span"
        className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
      >
        {STATUS_LABEL[status]}
      </Inline>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => void handleStatusChange(e.target.value as DraftGuideStatus)}
        className={clsx(
          "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1",
          STATUS_CLASS[status]
        )}
      >
        {GUIDE_STATUS_VALUES.map((statusValue) => (
          <option key={statusValue} value={statusValue}>
            {STATUS_LABEL[statusValue]}
          </option>
        ))}
      </select>
      {saveStatus === "saving" && (
        <span className="text-xs text-brand-secondary">Saving...</span>
      )}
      {saveStatus === "saved" && (
        <span className="text-xs text-brand-primary">Saved</span>
      )}
      {saveStatus === "error" && (
        <span className="text-xs text-brand-terra">Error</span>
      )}
    </div>
  );
}

function DraftDashboardContent({ lang }: Props) {
  usePagePreload({ lang, namespaces: ["guides"] });
  const canEdit = isGuideAuthoringEnabled() && Boolean(PREVIEW_TOKEN);

  const guides = listGuideManifestEntries().map((entry) => buildSummary(entry, lang));

  const sortedGuides = (() => {
    return [...guides].sort((a, b) => {
      if (a.status === b.status) return a.slug.localeCompare(b.slug);
      const order: DraftGuideStatus[] = ["draft", "review", "live"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  })();

  return (
    <Section as="main" className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Stack as="header" className="gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">
          Guides editorial
        </p>
        <h1 className="text-2xl font-semibold text-brand-heading">Draft & publication checklist</h1>
        <p className="text-sm text-brand-text/80">
          Every guide listed here can be previewed under the draft URL. Use the checklist to confirm
          translations, structured data, FAQs, and media are ready before promoting a guide to live.
          {" "}
          <a
            href="https://github.com/anthropics/base-shop/blob/main/apps/brikette/docs/guide-translation-workflow.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-primary underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary/80"
          >
            Learn about the translation workflow →
          </a>
        </p>
      </Stack>

      <section className="overflow-x-auto rounded-xl border border-brand-outline/20 bg-brand-surface shadow-sm">
        <table className="min-w-full divide-y divide-brand-outline/20 text-sm text-brand-text">
          <thead className="bg-brand-surface/80">
            <tr>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Guide</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Publish to</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Status</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Outstanding</th>
              <th className="px-4 py-3 text-start font-semibold text-brand-text/80">Draft preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline/10">
            {sortedGuides.map((guide) => {
              const outstanding = guide.checklist.items.filter((item) => item.status !== "complete");
              const publishAreas = Array.from(new Set([guide.primaryArea, ...guide.areas]));
              return (
                <tr key={guide.key} className="align-top">
                  <td className="px-4 py-3">
                    <Stack className="gap-1">
                      <p className="font-semibold text-brand-heading">{guide.slug}</p>
                      <p className="text-xs uppercase tracking-wide text-brand-text/60">
                        {guide.key}
                      </p>
                    </Stack>
                  </td>
                  <td className="px-4 py-3">
                    <Cluster>
                      {publishAreas.map((area) => {
                        const label = AREA_LABELS[area] ?? area;
                        const primary = area === guide.primaryArea;
                        return (
                          <Inline
                            key={`${guide.key}-${area}`}
                            className={`gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                              primary
                                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                : "border-brand-outline/30 bg-brand-surface/70 text-brand-text/80"
                            }`}
                          >
                            {label}
                            {primary ? (
                              <span className="text-xs uppercase tracking-wide text-brand-primary">
                                Primary
                              </span>
                            ) : null}
                          </Inline>
                        );
                      })}
                    </Cluster>
                  </td>
                  <td className="px-4 py-3">
                    <StatusDropdown
                      guideKey={guide.key}
                      initialStatus={guide.status}
                      canEdit={canEdit}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Stack className="gap-1">
                      {outstanding.length === 0 ? (
                        <span className="text-sm font-medium text-brand-secondary">All tasks complete</span>
                      ) : (
                        outstanding.map((item) => (
                          <Inline
                            key={item.id}
                            className="gap-2 text-sm text-brand-text/90"
                          >
                            <span className="h-2 w-2 rounded-full bg-brand-secondary" />
                            {formatOutstandingLabel(item)}
                          </Inline>
                        ))
                      )}
                    </Stack>
                  </td>
                  <td className="px-4 py-3">
                    <Stack className="gap-2">
                      <Link
                        href={`/${lang}/draft/${guide.draftPath}`}
                        prefetch={true}
                        className="inline-flex rounded-md border border-brand-outline/20 px-3 py-1 text-xs font-semibold text-brand-text/80 transition-colors hover:border-brand-outline/30 hover:bg-brand-surface/80"
                      >
                        Open draft
                      </Link>
                      {canEdit ? (
                        <Link
                          href={buildGuideEditUrl(lang, guide.key)}
                          prefetch={true}
                          className="inline-flex rounded-md border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/15"
                        >
                          Edit content
                        </Link>
                      ) : null}
                      <Link
                        href={`/${lang}/${getSlug(
                          guideAreaToSlugKey(guide.primaryArea),
                          lang
                        )}/${guideSlug(lang, guide.key)}`}
                        prefetch={true}
                        className="block text-xs font-medium text-brand-primary underline transition-colors hover:text-brand-primary/80"
                      >
                        View live route
                      </Link>
                    </Stack>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </Section>
  );
}

export default memo(DraftDashboardContent);
