import Link from "next/link";

import { isGuideAuthoringEnabled } from "@/lib/guide-authoring/config";
import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

export const dynamic = "force-dynamic";

export const metadata = {
  // i18n-exempt -- GS-001: Internal admin UI
  title: "Guide Authoring Dashboard — Business OS",
};

export default function GuideDashboardPage() {
  if (!isGuideAuthoringEnabled()) {
    return (
       
      // i18n-exempt -- GS-001: Internal admin UI
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-brand-text/60">
          Guide authoring is disabled. Set ENABLE_GUIDE_AUTHORING=1 in your environment.
        </p>
      </main>
    );
  }

  const entries = listGuideManifestEntries();

  const byStatus = {
    live: entries.filter((e) => e.status === "live"),
    review: entries.filter((e) => e.status === "review"),
    draft: entries.filter((e) => e.status !== "live" && e.status !== "review"),
  };

  return (
     
    // i18n-exempt -- GS-001: Internal admin UI
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-heading">Guide Authoring</h1>
            <p className="text-sm text-brand-text/70">
              {entries.length} guides total — {byStatus.live.length} live, {byStatus.review.length} review, {byStatus.draft.length} draft
            </p>
          </div>
          <Link
            href="/guides/validation"
            className="rounded-lg border border-brand-outline/40 px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-surface"
          >
            Validation report
          </Link>
        </div>

        {(["live", "review", "draft"] as const).map((status) => {
          const group = byStatus[status];
          if (group.length === 0) return null;
          return (
            <div key={status}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-text/60">
                {status} ({group.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

                {group
                  .sort((a, b) => a.key.localeCompare(b.key))
                  .map((entry) => (
                    <Link
                      key={entry.key}
                      href={`/guides/edit/${entry.key}`}
                      className="rounded-lg border border-brand-outline/20 bg-brand-surface p-3 transition hover:border-brand-primary/30 hover:shadow-sm"
                    >
                      <p className="font-medium text-brand-heading">{entry.slug || entry.key}</p>
                      <p className="mt-1 text-xs text-brand-text/50">{entry.key}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.status === "live"
                            ? "bg-green-100 text-green-800"
                            : entry.status === "review"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                        }`}>
                          {entry.status}
                        </span>
                        {entry.primaryArea && (
                          <span className="text-xs text-brand-text/40">{entry.primaryArea}</span>
                        )}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
