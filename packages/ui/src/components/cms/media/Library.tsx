// packages/ui/src/components/cms/media/Library.tsx
"use client";

import type { MediaItem } from "@acme/types";
import { useTranslations } from "@acme/i18n";
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
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
  onReplaceSuccess?: (item: MediaItem) => void;
  onReplaceError?: (message: string) => void;
  onSelect?: (item: WithUrl | null) => void;
  onBulkToggle?: (item: WithUrl, selected: boolean) => void;
  selectionEnabled?: boolean;
  isItemSelected?: (item: WithUrl) => boolean;
  selectedUrl?: string;
  isDeleting?: (item: WithUrl) => boolean;
  isReplacing?: (item: WithUrl) => boolean;
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
  onBulkToggle,
  selectionEnabled = false,
  isItemSelected,
  selectedUrl,
  isDeleting,
  isReplacing,
  emptyLibraryMessage,
  emptyResultsMessage,
}: LibraryProps): ReactElement {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");

  const derivedEmptyLibraryMessage =
    emptyLibraryMessage ?? t("Upload media to get started.");
  const derivedEmptyResultsMessage =
    emptyResultsMessage ?? t("No media matches your filters.");

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

  const derivedIsItemSelected = useMemo(() => {
    if (isItemSelected) return isItemSelected;
    if (!selectedUrl) return undefined;
    return (item: WithUrl) => item.url === selectedUrl;
  }, [isItemSelected, selectedUrl]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder={String(t("Search media..."))}
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="w-full flex-1"
        />
        {allTags.length > 0 && (
          <Select value={tag === "" ? "__all__" : tag} onValueChange={(v) => setTag(v === "__all__" ? "" : v)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder={String(t("All tags"))} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("All tags")}</SelectItem>
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
          onBulkToggle={onBulkToggle}
          selectionEnabled={selectionEnabled}
          isItemSelected={derivedIsItemSelected}
          isDeleting={isDeleting}
          isReplacing={isReplacing}
        />
      ) : (
        <div
          className="bg-muted text-muted-foreground flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg p-8 text-center"
          data-token={String(t("--color-muted"))}
          data-token-fg={String(t("--color-muted-fg"))}
        >
          <p className="text-sm font-medium text-fg" data-token={String(t("--color-fg"))}>
            {showEmptyLibrary ? t("No media yet") : t("No results")}
          </p>
          <p className="text-xs text-muted-foreground" data-token={String(t("--color-muted-fg"))}>
            {showEmptyLibrary ? derivedEmptyLibraryMessage : derivedEmptyResultsMessage}
          </p>
        </div>
      )}
    </div>
  );
}
