/* eslint-disable ds/no-unsafe-viewport-units, ds/enforce-layout-primitives -- BOS-11: Phase 0 scaffold UI */
"use client";

import Link from "next/link";

import { useTranslations } from "@acme/i18n";

import type { Business, Card, Idea, Lane } from "@/lib/types";

import { BoardLane } from "./BoardLane";

interface BoardViewProps {
  businessCode: string;
  businesses: Business[];
  lanes: Lane[];
  cardsByLane: Record<Lane, Card[]>;
  inboxIdeas: Idea[];
}

export function BoardView({
  businessCode,
  businesses,
  lanes,
  cardsByLane,
  inboxIdeas,
}: BoardViewProps) {
  const t = useTranslations();
  const currentBusiness = businesses.find((b) => b.id === businessCode);
  const isGlobal = businessCode === "global";

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="bg-card border-b border-border-2 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isGlobal
                ? t("businessOs.board.titles.global")
                : currentBusiness?.name || businessCode}
            </h1>
            {isGlobal ? (
              <p className="text-sm text-muted-foreground mt-1">
                {t("businessOs.board.descriptions.highPriority")}
              </p>
            ) : (
              currentBusiness?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentBusiness.description}
                </p>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/cards/new"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            >
              {t("businessOs.board.actions.newCard")}
            </Link>
            <Link
              href="/ideas/new"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            >
              {t("businessOs.board.actions.newIdea")}
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
            >
              {t("businessOs.board.actions.home")}
            </Link>
            {!isGlobal && (
              <Link
                href="/boards/global"
                className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
              >
                {t("businessOs.board.actions.globalBoard")}
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
                className="px-3 py-1 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
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
