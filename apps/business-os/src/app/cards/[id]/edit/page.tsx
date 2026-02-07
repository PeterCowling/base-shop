import Link from "next/link";
import { notFound } from "next/navigation";

import { getCardById } from "@acme/platform-core/repositories/businessOs.server";

import { CardEditorForm } from "@/components/card-editor/CardEditorForm";
import { BUSINESSES } from "@/lib/business-catalog";
import { getDb } from "@/lib/d1.server";

export const dynamic = "force-dynamic";

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/container-widths-only-at -- BOS-32: Phase 0 scaffold UI (ttl: 2026-03-31) */

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Page: Edit Card
 * Phase 0: Pete-only card editing
 */

export default async function EditCardPage({ params }: PageProps) {
  const { id } = await params;

  const db = getDb();
  const card = await getCardById(db, id);

  if (!card) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/cards/${id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Card
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Card</h1>
          <p className="mt-2 text-gray-600">
            Update card details, lane position, priority, or ownership.
          </p>
          <p className="mt-1 text-sm text-gray-500">Card ID: {id}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <CardEditorForm
            businesses={BUSINESSES}
            existingCard={card}
            baseFileSha={card.fileSha}
            mode="edit"
          />
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h2 className="text-sm font-medium text-yellow-900 mb-2">
            Important Notes
          </h2>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>
              • Business cannot be changed after card creation (data integrity)
            </li>
            <li>
              • Lane changes may trigger stage document creation (fact-find,
              plan, etc.)
            </li>
            <li>
              • Use &ldquo;Proposed Lane&rdquo; to suggest next stage without
              immediately moving
            </li>
            <li>
              • Changes are committed locally - remember to Sync to push to
              remote
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
