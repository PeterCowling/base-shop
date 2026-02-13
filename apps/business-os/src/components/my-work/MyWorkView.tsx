"use client";

import Link from "next/link";

import { Grid } from "@acme/design-system/primitives/Grid";

import { CompactCard } from "@/components/board/CompactCard";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import type { User } from "@/lib/current-user";
import type { Business, Card } from "@/lib/types";

interface MyWorkViewProps {
  assignedToMe: Card[];
  waitingAcceptance: Card[];
  dueSoon: Card[];
  businesses: Business[];
  currentUser: User;
}

/* eslint-disable ds/no-unsafe-viewport-units, ds/no-hardcoded-copy, ds/container-widths-only-at -- BOS-12: Phase 0 scaffold UI */
export function MyWorkView({
  assignedToMe,
  waitingAcceptance,
  dueSoon,
  currentUser,
}: MyWorkViewProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "My Work" },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-panel border-b border-border-1 px-6 py-4">
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-fg">My Work</h1>
            <p className="text-sm text-muted mt-1">
              Tasks assigned to {currentUser.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/boards/global"
              className="px-4 py-2 text-sm font-medium text-secondary bg-panel border border-border-2 rounded-md hover:bg-surface-1"
            >
              View All Boards
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-secondary bg-panel border border-border-2 rounded-md hover:bg-surface-1"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-8">
          {/* Waiting Acceptance Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-fg">
                Waiting Acceptance
              </h2>
              <p className="text-sm text-muted">
                Cards assigned to you in Inbox (click &quot;Accept & Start&quot;
                to begin)
              </p>
            </div>
            {waitingAcceptance.length === 0 ? (
              <div className="bg-panel rounded-lg border border-border-1 p-6 text-center text-muted">
                No cards waiting acceptance
              </div>
            ) : (
              <Grid cols={1} gap={4} className="md:grid-cols-2 lg:grid-cols-3">
                {waitingAcceptance.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </Grid>
            )}
          </section>

          {/* Due Soon Section */}
          {dueSoon.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-fg">
                  Due Soon (Next 7 Days)
                </h2>
                <p className="text-sm text-muted">
                  Cards with upcoming deadlines
                </p>
              </div>
              <Grid cols={1} gap={4} className="md:grid-cols-2 lg:grid-cols-3">
                {dueSoon.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </Grid>
            </section>
          )}

          {/* Assigned to Me Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-fg">
                All Assigned ({assignedToMe.length})
              </h2>
              <p className="text-sm text-muted">
                All active cards assigned to you (excluding Done)
              </p>
            </div>
            {assignedToMe.length === 0 ? (
              <div className="bg-panel rounded-lg border border-border-1 p-6 text-center text-muted">
                No active cards assigned to you. Visit the{" "}
                <Link
                  href="/boards/global"
                  className="text-info-fg hover:underline"
                >
                  board
                </Link>{" "}
                to claim tasks.
              </div>
            ) : (
              <Grid cols={1} gap={4} className="md:grid-cols-2 lg:grid-cols-3">
                {assignedToMe.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </Grid>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
