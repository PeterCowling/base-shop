"use client";

import type { DiffSummary } from "./diff";

interface Props {
  diff: DiffSummary | null;
}

const DiffSummaryView = ({ diff }: Props) => {
  if (!diff) return null;
  return (
    <div className="rounded border bg-muted/40 p-2 text-sm text-muted-foreground">
      <span className="font-medium">Changes:</span>
      <span className="ml-2">{diff.modified} modified</span>
      <span className="ml-2">{diff.added} added</span>
      <span className="ml-2">{diff.removed} removed</span>
      {(diff.addedIds?.length ?? 0) > 0 && (
        <div className="mt-1">
          <span className="font-medium">Added:</span>
          <span className="ml-1">{diff.addedIds!.slice(0, 5).join(", ")}{diff.addedIds!.length > 5 ? "…" : ""}</span>
        </div>
      )}
      {(diff.removedIds?.length ?? 0) > 0 && (
        <div className="mt-1">
          <span className="font-medium">Removed:</span>
          <span className="ml-1">{diff.removedIds!.slice(0, 5).join(", ")}{diff.removedIds!.length > 5 ? "…" : ""}</span>
        </div>
      )}
      {(diff.modifiedList?.length ?? 0) > 0 && (
        <div className="mt-1">
          <span className="font-medium">Modified:</span>
          <ul className="ml-2 list-disc">
            {diff.modifiedList!.slice(0, 5).map((m) => (
              <li key={m.id}>
                <span className="mr-1">{m.id}:</span>
                <span className="opacity-80">{m.keys.slice(0, 6).join(", ")}{m.keys.length > 6 ? "…" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiffSummaryView;

