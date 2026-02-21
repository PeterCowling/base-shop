import Link from "next/link";

import { buildIdeasSearchParams, type IdeasQueryState } from "./query-params";

interface IdeasPaginationProps {
  section: "primary" | "secondary";
  title: string;
  state: IdeasQueryState;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function IdeasPagination({
  section,
  title,
  state,
  page,
  pageSize,
  totalItems,
  totalPages,
}: IdeasPaginationProps) {
  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalItems);
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const pageKey = section === "primary" ? "primaryPage" : "secondaryPage";
  const previousHref = `/ideas?${buildIdeasSearchParams(state, {
    [pageKey]: previousPage,
  }).toString()}`;
  const nextHref = `/ideas?${buildIdeasSearchParams(state, {
    [pageKey]: nextPage,
  }).toString()}`;

  const isPreviousDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-1 bg-panel p-4 text-sm text-secondary md:flex-row md:items-center md:justify-between">
      <p>
        {title}: showing {pageStart}-{pageEnd} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={previousHref}
          aria-disabled={isPreviousDisabled}
          className={`rounded-md border px-3 py-1.5 ${
            isPreviousDisabled
              ? "pointer-events-none border-border-1 text-muted"
              : "border-border-2 text-secondary hover:bg-surface-1"
          }`}
        >
          Previous
        </Link>
        <span>
          Page {page} / {totalPages}
        </span>
        <Link
          href={nextHref}
          aria-disabled={isNextDisabled}
          className={`rounded-md border px-3 py-1.5 ${
            isNextDisabled
              ? "pointer-events-none border-border-1 text-muted"
              : "border-border-2 text-secondary hover:bg-surface-1"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
