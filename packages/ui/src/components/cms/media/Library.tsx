// packages/ui/src/components/cms/media/Library.tsx
"use client";

import type { MediaItem } from "@acme/types";
import { ChangeEvent, ReactElement, useMemo, useState } from "react";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";
import MediaFileList from "../MediaFileList";

type WithUrl = MediaItem & { url: string };

interface LibraryProps {
  files: WithUrl[];
  shop: string;
  onDelete: (url: string) => Promise<void> | void;
  onReplace: (oldUrl: string) => void;
  onReplaceSuccess?: (oldUrl: string, item: MediaItem) => void;
  onReplaceError?: (oldUrl: string, error: Error) => void;
  onSelect?: (item: WithUrl) => void;
  onOpenDetails?: (item: WithUrl) => void;
  onBulkToggle?: (item: WithUrl, selected: boolean) => void;
  selectionEnabled?: boolean;
  isItemSelected?: (item: WithUrl) => boolean;
  selectedUrl?: string | null;
  isDeleting?: (url: string) => boolean;
  isReplacing?: (url: string) => boolean;
  emptyLibraryMessage?: string;
  emptyResultsMessage?: string;
}

export default function Library({
  files,
  shop,
  onDelete,
  onReplace,
  onReplaceSuccess,
  onReplaceError,
  onSelect,
  onOpenDetails,
  onBulkToggle,
  selectionEnabled = false,
  isItemSelected,
  selectedUrl = null,
  isDeleting,
  isReplacing,
  emptyLibraryMessage = "Upload media to get started.",
  emptyResultsMessage = "No media matches your filters.",
}: LibraryProps): ReactElement {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");

  const allTags = useMemo(
    () => Array.from(new Set(files.flatMap((f) => f.tags ?? []))),
    [files]
  );

  const filteredFiles = files.filter((f) => {
    const name = (f.url ?? "").split("/").pop()?.toLowerCase() ?? "";
    const q = query.toLowerCase();
    const matchesQuery = !q || name.includes(q);
    const matchesTag = !tag || (f.tags ?? []).includes(tag);
    return matchesQuery && matchesTag;
  });

  const showResultsList = filteredFiles.length > 0;
  const showEmptyLibrary = files.length === 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search media..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="w-full flex-1"
        />
        {allTags.length > 0 && (
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All tags</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {showResultsList ? (
          <MediaFileList
            files={filteredFiles}
            shop={shop}
            onDelete={onDelete}
            onReplace={onReplace}
            onReplaceSuccess={onReplaceSuccess}
            onReplaceError={onReplaceError}
            onSelect={onSelect}
            onOpenDetails={onOpenDetails}
            onBulkToggle={onBulkToggle}
            selectionEnabled={selectionEnabled}
            isItemSelected={
              isItemSelected ?? ((item) => (selectedUrl ? item.url === selectedUrl : false))
            }
            isDeleting={isDeleting}
            isReplacing={isReplacing}
          />
      ) : (
        <div
          className="bg-muted text-muted-foreground flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg p-8 text-center"
          data-token="--color-muted"
          data-token-fg="--color-muted-fg"
        >
          <p className="text-sm font-medium text-fg" data-token="--color-fg">
            {showEmptyLibrary ? "No media yet" : "No results"}
          </p>
          <p className="text-xs text-muted-foreground" data-token="--color-muted-fg">
            {showEmptyLibrary ? emptyLibraryMessage : emptyResultsMessage}
          </p>
        </div>
      )}
    </div>
  );
}

