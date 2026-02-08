"use client";

import { useEffect, useMemo, useState } from "react";

import { listGuideManifestEntries } from "@/lib/guide-authoring/manifest-loader";

type GuideOption = {
  key: string;
  label: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (guideKey: string, label: string) => void;
};

export function GuideLinkPicker({ isOpen, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const options = useMemo<GuideOption[]>(() => {
    return listGuideManifestEntries()
      .map((entry) => ({
        key: entry.key,
        label: entry.slug || entry.key,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const filteredGuides = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((guide) =>
      guide.key.toLowerCase().includes(term) || guide.label.toLowerCase().includes(term)
    );
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-2 w-72 rounded-md border border-brand-outline/30 bg-brand-bg shadow-lg">
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search guides..."
        className="w-full border-b border-brand-outline/20 bg-brand-bg px-3 py-2 text-sm text-brand-heading"
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      />
      <ul className="max-h-52 overflow-y-auto" role="listbox" aria-label="Guide link options">
        {filteredGuides.length === 0 ? (
          <li className="px-3 py-2 text-xs text-brand-text/60">No matches</li>
        ) : (
          filteredGuides.map((guide) => (
            <li key={guide.key}>
              <button
                type="button"
                onClick={() => {
                  onSelect(guide.key, guide.label || guide.key);
                  onClose();
                }}
                className="w-full px-3 py-2 text-start text-sm text-brand-text hover:bg-brand-surface"
              >
                <div className="font-medium text-brand-heading">{guide.label || guide.key}</div>
                <div className="text-xs text-brand-text/50">{guide.key}</div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
