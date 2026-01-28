import Link from "next/link";

import { CardEditorForm } from "@/components/card-editor/CardEditorForm";
import { createRepoReader } from "@/lib/repo-reader";

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/container-widths-only-at -- BOS-32: Phase 0 scaffold UI (ttl: 2026-03-31) */

/**
 * Page: Create New Card
 * Phase 0: Pete-only card creation
 */
export default async function NewCardPage() {
  // Get repo root
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");

  // Create reader and fetch businesses
  const reader = createRepoReader(repoRoot);
  const businesses = await reader.getBusinesses();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/boards/global"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Board
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Card</h1>
          <p className="mt-2 text-gray-600">
            Create a card to track work through the kanban workflow. Cards start
            at a specific lane and progress through fact-finding, planning,
            execution, and reflection.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <CardEditorForm businesses={businesses} mode="create" />
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-sm font-medium text-blue-900 mb-2">
            About Cards
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Cards represent work items that flow through the kanban system
            </li>
            <li>
              • Each card has a lane (current stage) and optional proposed lane
              (next stage)
            </li>
            <li>
              • Priority determines ordering within lanes (P0 = critical, P5 =
              backlog)
            </li>
            <li>
              • Changes are committed locally - use the Sync button to push to
              remote
            </li>
            <li>
              • Stage documents (fact-find, plan, build, reflect) are created
              automatically as cards progress
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
