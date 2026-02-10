import Link from "next/link";

import { countIdeas, listIdeas } from "@acme/platform-core/repositories/businessOs.server";

import { toIdeaListItem } from "@/components/ideas/idea-utils";
import { IdeasFilters } from "@/components/ideas/IdeasFilters";
import { IdeasList } from "@/components/ideas/IdeasList";
import { IdeasPagination } from "@/components/ideas/IdeasPagination";
import {
  parseIdeasQueryState,
  PRIMARY_IDEA_PRIORITIES,
  SECONDARY_IDEA_PRIORITIES,
} from "@/components/ideas/query-params";
import { BUSINESSES } from "@/lib/business-catalog";
import { getDb } from "@/lib/d1.server";

export const dynamic = "force-dynamic";

interface IdeasPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/* eslint-disable ds/no-hardcoded-copy -- BOS-IDEAS-101 [ttl=2026-06-30] Internal backlog triage copy pending i18n extraction */
export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  const db = getDb();
  const parsedSearchParams = await searchParams;
  const state = parseIdeasQueryState(parsedSearchParams);
  const sharedFilters = {
    business: state.business || undefined,
    status: state.status === "all" ? undefined : state.status,
    location: state.location,
    tagContains: state.tag || undefined,
    search: state.q || undefined,
  };

  const [primaryTotalItems, secondaryTotalItems] = await Promise.all([
    countIdeas(db, { ...sharedFilters, priorities: PRIMARY_IDEA_PRIORITIES }),
    countIdeas(db, { ...sharedFilters, priorities: SECONDARY_IDEA_PRIORITIES }),
  ]);

  const primaryTotalPages = Math.max(
    1,
    Math.ceil(primaryTotalItems / state.primaryPageSize)
  );
  const secondaryTotalPages = Math.max(
    1,
    Math.ceil(secondaryTotalItems / state.secondaryPageSize)
  );

  const primaryPage = Math.min(state.primaryPage, primaryTotalPages);
  const secondaryPage = Math.min(state.secondaryPage, secondaryTotalPages);

  const [primaryIdeas, secondaryIdeas] = await Promise.all([
    listIdeas(db, {
      ...sharedFilters,
      priorities: PRIMARY_IDEA_PRIORITIES,
      limit: state.primaryPageSize,
      offset: (primaryPage - 1) * state.primaryPageSize,
    }),
    listIdeas(db, {
      ...sharedFilters,
      priorities: SECONDARY_IDEA_PRIORITIES,
      limit: state.secondaryPageSize,
      offset: (secondaryPage - 1) * state.secondaryPageSize,
    }),
  ]);

  const primaryItems = primaryIdeas.map(toIdeaListItem);
  const secondaryItems = secondaryIdeas.map(toIdeaListItem);
  const normalizedState = { ...state, primaryPage, secondaryPage };

  return (
    <main className="min-h-dvh bg-gray-50 p-4 md:p-6">
      <div className="mx-auto w-full space-y-4">
        <header className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ideas</h1>
              <p className="mt-1 text-sm text-gray-600">
                Priority-first backlog triage. Sorted by priority, created date, then ID.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/ideas/new"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + New Idea
              </Link>
              <Link
                href="/boards/global"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Open Board
              </Link>
            </div>
          </div>
        </header>

        <IdeasFilters businesses={BUSINESSES} state={normalizedState} />

        <section className="space-y-3">
          <header className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-blue-900">Primary Ideas (P1-P3)</h2>
            <p className="text-sm text-blue-700">
              Top-priority ideas for immediate fact-find and execution planning.
            </p>
          </header>
          <IdeasPagination
            section="primary"
            title="Primary"
            state={normalizedState}
            page={primaryPage}
            pageSize={state.primaryPageSize}
            totalItems={primaryTotalItems}
            totalPages={primaryTotalPages}
          />
          <IdeasList items={primaryItems} />
        </section>

        <section className="space-y-3">
          <header className="rounded-lg border border-gray-200 bg-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Secondary Ideas (P4-P5)</h2>
            <p className="text-sm text-gray-700">
              Lower-priority backlog ideas tracked separately from immediate execution candidates.
            </p>
          </header>
          <IdeasPagination
            section="secondary"
            title="Secondary"
            state={normalizedState}
            page={secondaryPage}
            pageSize={state.secondaryPageSize}
            totalItems={secondaryTotalItems}
            totalPages={secondaryTotalPages}
          />
          <IdeasList items={secondaryItems} />
        </section>
      </div>
    </main>
  );
}
