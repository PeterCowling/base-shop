"use client";

import { useEffect, useState } from "react";

type Props = {
  guideKey: string;
};

type ManifestViolation = {
  guideKey: string;
  status: string;
  draftOnly: boolean;
  violation: string;
  relatedGuide?: string;
  suggestion?: string;
};

type GuideValidationInfo = {
  hasViolations: boolean;
  violations: ManifestViolation[];
  relatedGuidesCount: number;
  minimumRequired: number;
  isOrphan: boolean;
  inboundLinksCount: number;
  inlineLinkCount: number;
  hasMapsUrls: boolean;
  missingReciprocals: string[];
};

export function ValidationTab({ guideKey }: Props) {
  const [validation, setValidation] = useState<GuideValidationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchValidation() {
      try {
        setLoading(true);
        const [manifestRes, coverageRes] = await Promise.all([
          fetch("/api/guides/validate/manifest"),
          fetch("/api/guides/validate/coverage?locale=en"),
        ]);

        if (!manifestRes.ok || !coverageRes.ok) {
          throw new Error("Failed to fetch validation data");
        }

        const manifest = await manifestRes.json();
        const coverage = await coverageRes.json();

        const guideViolations = manifest.violations.filter(
          (v: ManifestViolation) => v.guideKey === guideKey
        );

        const guideInThreshold = coverage.report.belowThreshold.find(
          (g: { key: string }) => g.key === guideKey
        );
        const isOrphan = coverage.report.orphans.includes(guideKey);

        const missingReciprocals = coverage.report.missingReciprocals
          .filter((r: { from: string; to: string }) => r.from === guideKey)
          .map((r: { from: string; to: string }) => r.to);

        const info: GuideValidationInfo = {
          hasViolations: guideViolations.length > 0,
          violations: guideViolations,
          relatedGuidesCount: guideInThreshold?.count ?? 0,
          minimumRequired: guideInThreshold?.minimum ?? 0,
          isOrphan,
          inboundLinksCount: 0,
          inlineLinkCount: 0,
          hasMapsUrls: false,
          missingReciprocals,
        };

        setValidation(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchValidation();
  }, [guideKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-brand-text/60">Loading validation data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Error loading validation: {error}</p>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-brand-heading">Validation Status</h2>
        <p className="text-sm text-brand-text/80">
          Cross-referencing quality and manifest correctness for this guide
        </p>
      </div>

      <div
        className={`rounded-lg border p-4 ${
          validation.hasViolations || validation.isOrphan || validation.relatedGuidesCount < validation.minimumRequired
            ? "border-amber-200 bg-amber-50"
            : "border-green-200 bg-green-50"
        }`}
      >
        {validation.hasViolations || validation.isOrphan || validation.relatedGuidesCount < validation.minimumRequired ? (
          <>
            <h3 className="mb-2 font-semibold text-amber-900">Validation Issues Found</h3>
            <p className="text-sm text-amber-800">
              This guide has some quality or cross-referencing issues that should be addressed.
            </p>
          </>
        ) : (
          <>
            <h3 className="mb-2 font-semibold text-green-900">All Validations Passed</h3>
            <p className="text-sm text-green-800">
              This guide meets all quality and cross-referencing requirements.
            </p>
          </>
        )}
      </div>

      {validation.hasViolations && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-900">Manifest Violations</h3>
          <div className="flex flex-col gap-2">
            {validation.violations.map((v, idx) => (
              <div key={idx} className="rounded bg-white p-3 text-sm">
                <p className="mb-1 font-medium text-red-900">{v.violation}</p>
                {v.relatedGuide && (
                  <p className="text-xs text-red-700">
                    Related guide: <code className="rounded bg-red-100 px-1">{v.relatedGuide}</code>
                  </p>
                )}
                {v.suggestion && (
                  <p className="mt-1 text-xs italic text-blue-700">
                    Suggestion: {v.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-brand-outline/20 bg-brand-surface p-4">
        <h3 className="mb-2 font-semibold text-brand-heading">Related Guides</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-heading">
            {validation.relatedGuidesCount}
          </span>
          <span className="text-sm text-brand-text/60">
            / {validation.minimumRequired} required
          </span>
        </div>
        {validation.relatedGuidesCount < validation.minimumRequired && (
          <p className="mt-2 text-sm text-amber-700">
            This guide needs {validation.minimumRequired - validation.relatedGuidesCount} more
            related guide{validation.minimumRequired - validation.relatedGuidesCount > 1 ? "s" : ""}.
          </p>
        )}
      </div>

      {validation.isOrphan && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 font-semibold text-amber-900">Orphan Guide</h3>
          <p className="text-sm text-amber-800">
            This guide has no inbound links from other guides, making it harder for users to discover.
            Consider adding links to this guide from related content.
          </p>
        </div>
      )}

      {validation.missingReciprocals.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">Missing Reciprocal Links</h3>
          <p className="mb-3 text-sm text-blue-800">
            This guide links to other guides that don&apos;t link back:
          </p>
          <div className="flex flex-col gap-1">
            {validation.missingReciprocals.map((target) => (
              <code
                key={target}
                className="rounded bg-white px-2 py-1 text-xs font-mono text-blue-900"
              >
                {target}
              </code>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-brand-outline/20 bg-brand-surface p-4">
        <h3 className="mb-2 font-semibold text-brand-heading">Actions</h3>
        <div className="flex flex-col gap-2">
          <a
            href="/guides/validation"
            className="inline-block text-sm font-medium text-brand-primary underline decoration-brand-primary/40 underline-offset-2 hover:text-brand-primary/80"
          >
            View full validation report
          </a>
        </div>
      </div>
    </div>
  );
}
