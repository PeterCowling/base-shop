import Link from "next/link";

import { IdeaForm } from "@/components/idea-form/IdeaForm";
import { getRepoRoot } from "@/lib/get-repo-root";
import { createRepoReader } from "@/lib/repo-reader";

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/container-widths-only-at -- BOS-13: Phase 0 scaffold UI (ttl: 2026-03-31) */

/**
 * Page: Create New Idea
 * Phase 0: Simple form for Pete-only idea submission
 */
export default async function NewIdeaPage() {
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
          <h1 className="text-3xl font-bold text-fg">Create New Idea</h1>
          <p className="mt-2 text-muted">
            Submit a raw idea to the inbox. It will be reviewed and potentially
            worked up into a card.
          </p>
        </div>

        {/* Form */}
        <div className="bg-panel rounded-lg shadow p-6">
          <IdeaForm businesses={businesses} />
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-info-soft border border-info-soft rounded-md">
          <h2 className="text-sm font-medium text-info-fg mb-2">
            About Ideas
          </h2>
          <ul className="text-sm text-info-fg space-y-1">
            <li>
              • Ideas are raw thoughts that need refinement before becoming work
              items
            </li>
            <li>
              • They start in the inbox and can be worked up into cards through
              the fact-find/plan process
            </li>
            <li>
              • Keep the title concise and the description focused on the core
              opportunity
            </li>
            <li>
              • Changes are committed locally - use the Sync button to push to
              remote
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
