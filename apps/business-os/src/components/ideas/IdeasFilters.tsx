import type { Business } from "@/lib/types";

import {
  IDEA_LOCATIONS,
  IDEA_STATUSES,
  IDEAS_PAGE_SIZE_OPTIONS,
  type IdeasQueryState,
} from "./query-params";

/* eslint-disable ds/no-hardcoded-copy -- BOS-IDEAS-102 [ttl=2026-06-30] Internal triage controls pending DS/i18n pass */
interface IdeasFiltersProps {
  businesses: Business[];
  state: IdeasQueryState;
}

export function IdeasFilters({ businesses, state }: IdeasFiltersProps) {
  return (
    <form
      method="get"
      action="/ideas"
      className="rounded-lg border border-gray-200 bg-white p-4"
    >
      <input type="hidden" name="primaryPage" value="1" />
      <input type="hidden" name="secondaryPage" value="1" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Search
          <input
            type="search"
            name="q"
            defaultValue={state.q}
            placeholder="ID, title, content, tags"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Business
          <select
            name="business"
            defaultValue={state.business}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">All businesses</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.id}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Status
          <select
            name="status"
            defaultValue={state.status}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="all">All statuses</option>
            {IDEA_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Location
          <select
            name="location"
            defaultValue={state.location}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {IDEA_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location === "all" ? "All locations" : location}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Tag contains
          <input
            type="text"
            name="tag"
            defaultValue={state.tag}
            placeholder="ops"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Primary page size
          <select
            name="primaryPageSize"
            defaultValue={String(state.primaryPageSize)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {IDEAS_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Secondary page size
          <select
            name="secondaryPageSize"
            defaultValue={String(state.secondaryPageSize)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {IDEAS_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply filters
        </button>
        <a
          href="/ideas"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
