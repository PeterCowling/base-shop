/**
 * Archive View
 * Shows archived cards based on user permissions:
 * - Pete & Cristiana: See all archived cards
 * - Other users: See only their own archived cards
 */

import Link from "next/link";

import { CompactCard } from "@/components/board/CompactCard";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { orderCards } from "@/lib/board-logic";
import { canViewAllArchived,getCurrentUserServer } from "@/lib/current-user";
import { createRepoReader } from "@/lib/repo-reader";

/* eslint-disable ds/no-hardcoded-copy, ds/enforce-layout-primitives, ds/no-unsafe-viewport-units -- BOS-04 */
// i18n-exempt -- BOS-04 [ttl=2026-03-01] Archive page scaffold; real UI in BOS-11+
export default async function ArchivePage() {
  const currentUser = getCurrentUserServer();
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const reader = createRepoReader(repoRoot);

  // Fetch all archived cards
  const allArchivedCards = await reader.queryCards({
    includeArchived: true,
  });

  // Filter to only archived cards (exclude active ones)
  // Archived cards are stored in the /archive/ subdirectory
  const archivedOnly = allArchivedCards.filter((card) =>
    card.filePath.includes("/archive/")
  );

  // Apply permission filtering
  const visibleCards = canViewAllArchived(currentUser)
    ? archivedOnly // Admins see all
    : archivedOnly.filter((card) => card.Owner === currentUser.name); // Users see only their own

  // Sort cards
  const sortedCards = orderCards(visibleCards);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Archive" },
  ];

  const isAdmin = canViewAllArchived(currentUser);

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="bg-card border-b border-border-2 px-6 py-4">
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Archived Cards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? `Viewing all archived cards (${sortedCards.length} total)`
                : `Viewing your archived cards (${sortedCards.length} total)`}
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {sortedCards.length === 0 ? (
          <div className="bg-card border border-border-2 rounded-lg p-12 text-center">
            <p className="text-muted-foreground">
              {isAdmin
                ? "No archived cards found."
                : "You have no archived cards."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedCards.map((card) => (
              <CompactCard
                key={card.ID}
                card={card}
                showBusinessTag={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      {isAdmin && (
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Admin View:</strong> You (
              {currentUser.name}) can see all archived cards from all users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate metadata
 */
export function generateMetadata() {
  return {
    title: "Archive - Business OS",
    description: "View archived cards",
  };
}
