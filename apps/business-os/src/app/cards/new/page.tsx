import Link from "next/link";

import { CardEditorForm } from "@/components/card-editor/CardEditorForm";
import { getRepoRoot } from "@/lib/get-repo-root";
import { createRepoReader } from "@/lib/repo-reader";

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/container-widths-only-at -- BOS-32: Phase 0 scaffold UI (ttl: 2026-03-31) */

/**
 * Page: Create New Card
 * Phase 0: Pete-only card creation
 */
export default async function NewCardPage() {
  // Get repo root
  const repoRoot = getRepoRoot();

  // Create reader and fetch businesses
  const reader = createRepoReader(repoRoot);
  const businesses = await reader.getBusinesses();

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/boards/global"
              className="text-info-fg hover:text-info-fg"
            >
              ← Back to Board
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-fg">Create New Card</h1>
          <p className="mt-2 text-muted">
            Create a legacy compatibility card. Workflow-first operations should
            start from ideas, plans, and startup-loop artifacts unless existing
            card data must be preserved.
          </p>
        </div>

        {/* Form */}
        <div className="bg-panel rounded-lg shadow p-6">
          <CardEditorForm businesses={businesses} mode="create" />
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-info-soft border border-info-soft rounded-md">
          <h2 className="text-sm font-medium text-info-fg mb-2">
            About Legacy Cards
          </h2>
          <ul className="text-sm text-info-fg space-y-1">
            <li>
              • Cards remain available for legacy compatibility, not as the
              primary operating model
            </li>
            <li>
              • New work should usually start in Ideas, Plans, or workflow docs
            </li>
            <li>
              • If you create a card, prefer using it only when existing board
              data or legacy references require it
            </li>
            <li>
              • Changes are committed locally - use the Sync button to push to
              remote
            </li>
            <li>
              • Stage-document behavior still exists, but it is transitional and
              tied to the legacy board model
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
