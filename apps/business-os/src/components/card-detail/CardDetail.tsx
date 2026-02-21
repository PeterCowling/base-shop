"use client";

import Link from "next/link";

import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import type { User } from "@/lib/current-user";
import { canEditCard } from "@/lib/current-user";
import type { CommitHistoryEntry } from "@/lib/git-history";
import type { Business, Card, StageDoc } from "@/lib/types";

import { CardActionsPanel } from "./CardActionsPanel";
import { CardHeader } from "./CardHeader";
import { CardHistory } from "./CardHistory";
import { CardMetadata } from "./CardMetadata";
import { CardStageDocs } from "./CardStageDocs";
import { MarkdownContent } from "./MarkdownContent";

interface CardDetailProps {
  card: Card;
  stageDocs: {
    factFind?: StageDoc;
    plan?: StageDoc;
    build?: StageDoc;
    reflect?: StageDoc;
  };
  business: Business | null;
  currentUser: User;
  history?: CommitHistoryEntry[];
  githubUrl?: string;
}

/* eslint-disable ds/no-unsafe-viewport-units, ds/no-hardcoded-copy, ds/container-widths-only-at -- BOS-12: Phase 0 scaffold UI */
export function CardDetail({
  card,
  stageDocs,
  business,
  currentUser,
  history = [],
  githubUrl,
}: CardDetailProps) {
  const userCanEdit = canEditCard(currentUser, card);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    {
      label: business ? `${business.name} Board` : "Board",
      href: card.Business ? `/boards/${card.Business}` : "/boards/global",
    },
    { label: `Card ${card.ID}` },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-panel border-b border-border-1 px-6 py-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={
                card.Business
                  ? `/boards/${card.Business}`
                  : "/boards/global"
              }
              className="text-sm font-medium text-muted hover:text-fg"
            >
              ← Back to Board
            </Link>
            {business && (
              <span className="text-sm text-muted">
                {business.name}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {userCanEdit && (
              <Link
                href={`/cards/${card.ID}/edit`}
                className="px-4 py-2 text-sm font-medium text-accent-fg bg-accent rounded-md hover:bg-accent/90"
              >
                Edit Card
              </Link>
            )}
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-secondary bg-panel border border-border-2 rounded-md hover:bg-surface-1"
            >
              Home
            </Link>
          </div>
        </div>
        <CardHeader card={card} />
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card body */}
            <div className="bg-panel rounded-lg border border-border-1 p-6">
              <h2 className="text-lg font-semibold text-fg mb-4">
                Description
              </h2>
              <MarkdownContent content={card.content} />
            </div>

            {/* Stage docs */}
            {(stageDocs.factFind ||
              stageDocs.plan ||
              stageDocs.build ||
              stageDocs.reflect) && (
              <CardStageDocs stageDocs={stageDocs} cardId={card.ID} />
            )}

            {/* History (BOS-28) */}
            {history.length > 0 && (
              <div className="bg-panel rounded-lg border border-border-1 p-6">
                <CardHistory history={history} githubUrl={githubUrl} />
              </div>
            )}
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            <CardMetadata card={card} />

            {/* Dependencies */}
            {card.Dependencies && card.Dependencies.length > 0 && (
              <div className="bg-panel rounded-lg border border-border-1 p-4">
                <h3 className="text-sm font-semibold text-fg mb-3">
                  Dependencies
                </h3>
                <ul className="space-y-2">
                  {card.Dependencies.map((dep) => (
                    <li key={dep}>
                      <Link
                        href={`/cards/${dep}`}
                        className="text-sm text-info-fg hover:text-info-fg hover:underline"
                      >
                        {dep}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick actions */}
            <CardActionsPanel card={card} currentUser={currentUser} userCanEdit={userCanEdit} />
          </div>
        </div>
      </div>
    </div>
  );
}
