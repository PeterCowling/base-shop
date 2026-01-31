"use client";

import Link from "next/link";

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

/* eslint-disable ds/no-unsafe-viewport-units, ds/no-hardcoded-copy, ds/container-widths-only-at, ds/enforce-layout-primitives -- BOS-12: Phase 0 scaffold UI */
export function MyWorkView({
  assignedToMe,
  waitingAcceptance,
  dueSoon,
  businesses: _businesses,
  currentUser,
}: MyWorkViewProps) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "My Work" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
            <p className="text-sm text-gray-600 mt-1">
              Tasks assigned to {currentUser.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/boards/global"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              View All Boards
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
              <h2 className="text-lg font-semibold text-gray-900">
                Waiting Acceptance
              </h2>
              <p className="text-sm text-gray-600">
                Cards assigned to you in Inbox (click{" "}
                <span className="font-mono">Accept &amp; Start</span> to begin)
              </p>
            </div>
            {waitingAcceptance.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                No cards waiting acceptance
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waitingAcceptance.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Due Soon Section */}
          {dueSoon.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Due Soon (Next 7 Days)
                </h2>
                <p className="text-sm text-gray-600">
                  Cards with upcoming deadlines
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueSoon.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Assigned to Me Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Assigned ({assignedToMe.length})
              </h2>
              <p className="text-sm text-gray-600">
                All active cards assigned to you (excluding Done)
              </p>
            </div>
            {assignedToMe.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                No active cards assigned to you. Visit the{" "}
                <Link
                  href="/boards/global"
                  className="text-blue-600 hover:underline"
                >
                  board
                </Link>{" "}
                to claim tasks.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedToMe.map((card) => (
                  <CompactCard
                    key={card.ID}
                    card={card}
                    showBusinessTag={true}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
