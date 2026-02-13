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
      return "bg-danger-soft text-danger-fg";
    case "P1":
      return "bg-warning-soft text-warning-fg";
    case "P2":
      return "bg-warning-soft text-warning-fg";
    case "P3":
      return "bg-info-soft text-info-fg";
    case "P4":
      return "bg-surface-1 text-secondary";
    default:
      return "bg-surface-1 text-secondary";
  }
}

export function IdeasList({ items }: IdeasListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-2 bg-panel p-10 text-center text-sm text-muted">
        No ideas matched this filter set.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-1 bg-panel">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full table-auto text-start text-sm">
          <thead className="border-b border-border-1 bg-bg text-xs uppercase tracking-wide text-muted">
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
                className="cursor-pointer border-b border-border-1 hover:bg-surface-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
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
                <td className="px-4 py-3 font-mono text-xs text-secondary">{item.id}</td>
                <td className="px-4 py-3 font-medium text-fg">{item.title}</td>
                <td className="px-4 py-3 text-secondary">{item.business}</td>
                <td className="px-4 py-3 text-secondary">{item.status}</td>
                <td className="px-4 py-3 text-secondary">{item.location}</td>
                <td className="px-4 py-3 text-secondary">{formatDate(item.createdDate)}</td>
                <td className="px-4 py-3 text-secondary">
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
              className="min-h-11 min-w-11 w-full rounded-lg border border-border-1 bg-panel p-4 text-start shadow-sm hover:bg-surface-1"
              onClick={() => router.push(`/ideas/${item.id}`)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${priorityClasses(item.priority)}`}
                >
                  {item.priority}
                </span>
                <span className="font-mono text-xs text-muted">{item.id}</span>
              </div>
              <h2 className="text-sm font-semibold text-fg">{item.title}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
                <div>
                  <dt className="font-medium text-secondary">Business</dt>
                  <dd>{item.business}</dd>
                </div>
                <div>
                  <dt className="font-medium text-secondary">Status</dt>
                  <dd>{item.status}</dd>
                </div>
                <div>
                  <dt className="font-medium text-secondary">Location</dt>
                  <dd>{item.location}</dd>
                </div>
                <div>
                  <dt className="font-medium text-secondary">Created</dt>
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
