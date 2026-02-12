"use client";

import { useRouter } from "next/navigation";

import type { IdeaListItem } from "./types";

/* eslint-disable ds/no-hardcoded-copy, ds/enforce-layout-primitives -- BOS-IDEAS-103 [ttl=2026-06-30] Internal list layout pending DS/i18n pass */
interface IdeasListProps {
  items: IdeaListItem[];
}

function formatDate(value: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function priorityClasses(priority: string): string {
  switch (priority) {
    case "P0":
      return "bg-red-100 text-red-800";
    case "P1":
      return "bg-orange-100 text-orange-800";
    case "P2":
      return "bg-amber-100 text-amber-800";
    case "P3":
      return "bg-blue-100 text-blue-800";
    case "P4":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function IdeasList({ items }: IdeasListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
        No ideas matched this filter set.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full table-auto text-start text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Idea ID</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                role="link"
                tabIndex={0}
                aria-label={`Open idea ${item.id}`}
                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                onClick={() => router.push(`/ideas/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/ideas/${item.id}`);
                  }
                }}
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClasses(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                <td className="px-4 py-3 text-gray-700">{item.business}</td>
                <td className="px-4 py-3 text-gray-700">{item.status}</td>
                <td className="px-4 py-3 text-gray-700">{item.location}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(item.createdDate)}</td>
                <td className="px-4 py-3 text-gray-700">
                  {item.tags.length > 0 ? item.tags.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 p-3 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-label={`Open idea ${item.id}`}
              className="min-h-11 min-w-11 w-full rounded-lg border border-gray-200 bg-white p-4 text-start shadow-sm hover:bg-gray-50"
              onClick={() => router.push(`/ideas/${item.id}`)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClasses(item.priority)}`}
                >
                  {item.priority}
                </span>
                <span className="font-mono text-xs text-gray-600">{item.id}</span>
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <dt className="font-medium text-gray-700">Business</dt>
                  <dd>{item.business}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Status</dt>
                  <dd>{item.status}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Location</dt>
                  <dd>{item.location}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Created</dt>
                  <dd>{formatDate(item.createdDate)}</dd>
                </div>
              </dl>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
