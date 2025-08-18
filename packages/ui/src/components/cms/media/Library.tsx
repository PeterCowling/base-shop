// packages/ui/src/components/cms/media/Library.tsx
"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";
import type { MediaItem } from "@acme/types";
import { ChangeEvent, ReactElement, useMemo, useState } from "react";
import MediaFileList from "../MediaFileList";

interface LibraryProps {
  files: MediaItem[];
  shop: string;
  onDelete: (url: string) => void;
  onReplace: (oldUrl: string, item: MediaItem) => void;
}

export default function Library({
  files,
  shop,
  onDelete,
  onReplace,
}: LibraryProps): ReactElement {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");

  const allTags = useMemo(
    () => Array.from(new Set(files.flatMap((f) => f.tags ?? []))),
    [files]
  );

  const filteredFiles = files.filter((f) => {
    const name = f.url.split("/").pop()?.toLowerCase() ?? "";
    const q = query.toLowerCase();
    const matchesQuery = !q || name.includes(q);
    const matchesTag = !tag || (f.tags ?? []).includes(tag);
    return matchesQuery && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          type="search"
          placeholder="Search media..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="flex-1"
        />
        {allTags.length > 0 && (
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="w-[180px]">
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
      {filteredFiles.length > 0 && (
        <MediaFileList
          files={filteredFiles}
          shop={shop}
          onDelete={onDelete}
          onReplace={onReplace}
        />
      )}
    </div>
  );
}

