"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ManifestViolation = {
  guideKey: string;
  status: string;
  draftOnly: boolean;
  violation: string;
  relatedGuide?: string;
  suggestion?: string;
};

type ManifestValidation = {
  success: boolean;
  summary: {
    totalGuides: number;
    guidesWithRelatedGuides: number;
    totalRelatedGuides: number;
    violationCount: number;
  };
  violations: ManifestViolation[];
  violationsByType: Record<string, ManifestViolation[]>;
};

type CoverageReport = {
  totalGuides: number;
  byStatus: {
    live: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
    review: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
    draft: { total: number; withRelatedGuides: number; withoutRelatedGuides: number };
  };
  belowThreshold: Array<{ key: string; status: string; count: number; minimum: number }>;
  orphans: string[];
  inlineLinkStats: {
    guidesWithLinks: number;
    totalLinks: number;
    average: number;
  };
  mapsUrlCount: number;
  missingReciprocals: Array<{ from: string; to: string }>;
};

type CoverageResponse = {
  success: boolean;
  locale: string;
  report: CoverageReport;
};

export function ValidationDashboard() {
  const [manifestData, setManifestData] = useState<ManifestValidation | null>(null);
  const [coverageData, setCoverageData] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchValidationData() {
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

        setManifestData(manifest);
        setCoverageData(coverage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchValidationData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Guide Validation</h1>
          <p className="text-lg text-gray-600 mb-8">Loading validation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Guide Validation</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!manifestData || !coverageData) {
    return null;
  }

  const { summary, violations, violationsByType } = manifestData;
  const { report } = coverageData;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/en/draft"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Guide Validation & Coverage</h1>
          <p className="text-lg text-gray-600">
            Quality metrics and cross-referencing analysis for all guides
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{summary.totalGuides}</div>
            <div className="text-sm text-gray-600 mt-1">Total Guides</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">
              {summary.guidesWithRelatedGuides}
            </div>
            <div className="text-sm text-gray-600 mt-1">With Related Guides</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div
              className={`text-3xl font-bold ${violations.length === 0 ? "text-green-600" : "text-amber-600"}`}
            >
              {violations.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Validation Issues</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{report.orphans.length}</div>
            <div className="text-sm text-gray-600 mt-1">Orphan Guides</div>
          </div>
        </div>

        {/* Manifest Validation */}
        <section className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Manifest Validation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Checks for broken references, duplicates, and policy violations
            </p>
          </div>
          <div className="p-6">
            {violations.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  ✅ All manifest validations passed! No violations found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(violationsByType).map(([type, typeViolations]) => (
                  <div key={type} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <h3 className="font-bold text-amber-900 mb-2">
                      {type} ({typeViolations.length})
                    </h3>
                    <ul className="space-y-2">
                      {typeViolations.slice(0, 10).map((v, idx) => (
                        <li key={idx} className="text-sm">
                          <code className="bg-white px-2 py-1 rounded text-xs">
                            {v.guideKey}
                          </code>
                          <span className="text-gray-700 ms-2">{v.violation}</span>
                          {v.suggestion && (
                            <span className="text-blue-600 ms-2 italic">
                              (Did you mean: {v.suggestion}?)
                            </span>
                          )}
                        </li>
                      ))}
                      {typeViolations.length > 10 && (
                        <li className="text-sm text-gray-600 italic">
                          ...and {typeViolations.length - 10} more
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Coverage by Status */}
        <section className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Coverage by Publication Status</h2>
            <p className="text-sm text-gray-600 mt-1">
              Minimum thresholds: live ≥2, review ≥1, draft 0
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["live", "review", "draft"] as const).map((status) => {
                const stats = report.byStatus[status];
                const percentage =
                  stats.total > 0
                    ? Math.round((stats.withRelatedGuides / stats.total) * 100)
                    : 0;
                return (
                  <div key={status} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold capitalize">{status}</h3>
                      <span className="text-2xl font-bold">{stats.total}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">With related guides:</span>
                        <span className="font-medium">{stats.withRelatedGuides}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Without related guides:</span>
                        <span className="font-medium">{stats.withoutRelatedGuides}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coverage:</span>
                          <span className="font-bold text-blue-600">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Guides Below Threshold */}
        {report.belowThreshold.length > 0 && (
          <section className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Below Minimum Threshold</h2>
              <p className="text-sm text-gray-600 mt-1">
                Guides that don't meet the minimum relatedGuides policy for their status
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {report.belowThreshold.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <code className="text-sm font-mono">{item.key}</code>
                      <span className="text-xs text-gray-500 ms-2">({item.status})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red-600 font-medium">{item.count}</span>
                      <span className="text-gray-500"> / </span>
                      <span className="text-gray-600">{item.minimum} minimum</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Orphan Guides */}
        {report.orphans.length > 0 && (
          <section className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Orphan Guides</h2>
              <p className="text-sm text-gray-600 mt-1">
                Guides with no inbound links from other guides (harder to discover)
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {report.orphans.slice(0, 50).map((key) => (
                  <code
                    key={key}
                    className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700"
                  >
                    {key}
                  </code>
                ))}
              </div>
              {report.orphans.length > 50 && (
                <p className="text-sm text-gray-600 mt-4 italic">
                  ...and {report.orphans.length - 50} more
                </p>
              )}
            </div>
          </section>
        )}

        {/* Missing Reciprocals */}
        {report.missingReciprocals.length > 0 && (
          <section className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Missing Reciprocal Links</h2>
              <p className="text-sm text-gray-600 mt-1">
                Guides that link to others but don't get linked back (informational only)
              </p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Not all relationships need to be symmetric. Overview guides often link to
                  specifics without reciprocation.
                </p>
              </div>
              <div className="space-y-2">
                {report.missingReciprocals.slice(0, 20).map((item, idx) => (
                  <div key={idx} className="flex items-center text-sm p-2 border rounded">
                    <code className="font-mono text-xs text-gray-700">{item.from}</code>
                    <span className="mx-2 text-gray-400">→</span>
                    <code className="font-mono text-xs text-gray-700">{item.to}</code>
                    <span className="ms-auto text-xs text-gray-500 italic">
                      (missing: {item.to} → {item.from})
                    </span>
                  </div>
                ))}
              </div>
              {report.missingReciprocals.length > 20 && (
                <p className="text-sm text-gray-600 mt-4 italic">
                  Showing first 20 of {report.missingReciprocals.length} missing reciprocals
                </p>
              )}
            </div>
          </section>
        )}

        {/* Additional Stats */}
        <section className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Additional Metrics</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-2">Inline Link Usage</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guides with %LINK: tokens:</span>
                    <span className="font-medium">{report.inlineLinkStats.guidesWithLinks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total inline links:</span>
                    <span className="font-medium">{report.inlineLinkStats.totalLinks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average per guide:</span>
                    <span className="font-medium">
                      {report.inlineLinkStats.average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Google Maps Integration</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guides with Maps URLs:</span>
                    <span className="font-medium">{report.mapsUrlCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            For detailed documentation, see{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              docs/guide-authoring-best-practices.md
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
