"use client";

import { useMemo } from "react";
import type { VersionEntry } from "./api";

interface Props {
  versions: VersionEntry[] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const VersionList = ({ versions, selectedId, onSelect }: Props) => {
  const items = useMemo(() => versions ?? [], [versions]);
  return (
    <div className="col-span-1">
      <div className="text-sm font-medium mb-2">Versions{/* i18n-exempt -- PB-1023 */}</div>
      <div className="max-h-64 overflow-y-auto rounded border">
        {items.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:bg-accent ${selectedId === v.id ? "bg-accent" : ""}`}
            aria-label={`Select version ${v.label}`}
          >
            <span className="truncate" title={v.label}>{v.label}</span>
            <time className="ms-2 shrink-0 text-muted-foreground" dateTime={v.timestamp}>
              {new Date(v.timestamp).toLocaleString()}
            </time>
          </button>
        ))}
        {items.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground">No versions yet{/* i18n-exempt -- PB-1023 */}</div>
        )}
      </div>
    </div>
  );
};

export default VersionList;
