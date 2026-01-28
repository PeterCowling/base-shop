"use client";

import Link from "next/link";

import type { Business, Card, Idea, Lane } from "@/lib/types";

import { BoardLane } from "./BoardLane";

interface BoardViewProps {
  businessCode: string;
  businesses: Business[];
  lanes: Lane[];
  cardsByLane: Record<Lane, Card[]>;
  inboxIdeas: Idea[];
}

/* eslint-disable ds/no-unsafe-viewport-units, ds/enforce-layout-primitives -- BOS-11: Phase 0 scaffold UI */
export function BoardView({
  businessCode,
  businesses,
  lanes,
  cardsByLane,
  inboxIdeas,
}: BoardViewProps) {
  const currentBusiness = businesses.find((b) => b.id === businessCode);
  const isGlobal = businessCode === "global";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isGlobal ? "Global Board" : currentBusiness?.name || businessCode}
            </h1>
            {isGlobal ? (
              <p className="text-sm text-gray-600 mt-1">
                High priority cards (P0/P1) across all businesses
              </p>
            ) : (
              currentBusiness?.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentBusiness.description}
                </p>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/cards/new"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + New Card
            </Link>
            <Link
              href="/ideas/new"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + New Idea
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Home
            </Link>
            {!isGlobal && (
              <Link
                href="/boards/global"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Global Board
              </Link>
            )}
          </div>
        </div>

        {/* Business selector for global board */}
        {isGlobal && (
          <div className="mt-4 flex gap-2">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/boards/${business.id}`}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {business.id}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Board lanes */}
      <div className="flex gap-4 p-6 overflow-x-auto">
        {lanes.map((lane) => {
          const cards = cardsByLane[lane] || [];
          // For Inbox lane, show ideas too
          const ideas = lane === "Inbox" ? inboxIdeas : [];

          return (
            <BoardLane
              key={lane}
              lane={lane}
              cards={cards}
              ideas={ideas}
              showBusinessTag={isGlobal}
            />
          );
        })}
      </div>
    </div>
  );
}
