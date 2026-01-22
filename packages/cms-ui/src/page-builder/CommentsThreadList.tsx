"use client";

// i18n: This panel is editor-only, but strings are still localized for consistency with ds/no-hardcoded-copy

import * as React from "react";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";

import type { CommentThread, ThreadFilter } from "./CommentsDrawer";

function formatTime(ts?: string) {
  try {
    return ts ? new Date(ts).toLocaleString() : "";
  } catch {
    return ts ?? "";
  }
}

export interface CommentsThreadListProps {
  threads: CommentThread[];
  filtered: CommentThread[];
  filter: ThreadFilter;
  onFilterChange: (f: ThreadFilter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  componentsOptions?: { id: string; label: string }[];
  onCreate?: (componentId: string, text: string, assignedTo?: string | null) => Promise<void> | void;
  flashId?: string | null;
}

export default function CommentsThreadList({
  threads: _threads,
  filtered,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  selectedId,
  onSelect,
  componentsOptions,
  onCreate,
  flashId,
}: CommentsThreadListProps) {
  const [newOpen, setNewOpen] = React.useState(false);
  const [newCompId, setNewCompId] = React.useState<string | undefined>(undefined);
  const [newText, setNewText] = React.useState("");
  const [newAssign, setNewAssign] = React.useState("");
  const rowsRef = React.useRef<Record<string, HTMLLIElement | null>>({});

  const t = useTranslations();

  React.useEffect(() => {
    const id = flashId || selectedId;
    if (!id) return;
    const el = rowsRef.current[id];
    if (el) {
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [flashId, selectedId, filtered.length]);

  return (
    <Stack className="h-full w-full border-r">
      <Cluster alignY="center" className="border-b p-2 gap-2">
        <Inline gap={1}>
          {(["all", "open", "resolved", "assigned"] as ThreadFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => onFilterChange(f)}
            >
              {f === "all" ? t("cms.builder.comments.filter.all") : f === "open" ? t("cms.builder.comments.filter.open") : f === "resolved" ? t("cms.builder.comments.filter.resolved") : t("cms.builder.comments.filter.assigned")}
            </Button>
          ))}
        </Inline>
        <Input
          placeholder={t("cms.builder.comments.search.placeholder") as string}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="ms-auto h-7 w-32 text-xs"
        />
      </Cluster>

      {onCreate && (
        <div className="border-b p-2">
          {newOpen ? (
            <div className="space-y-2">
              <Inline alignY="center" gap={2}>
                <div className="min-w-0 flex-1">
                  <Select value={newCompId} onValueChange={(v) => setNewCompId(v)}>
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder={t("cms.builder.comments.selectComponent") as string} />
                    </SelectTrigger>
                    <SelectContent>
                      {(componentsOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" className="h-8 px-2" onClick={() => setNewOpen(false)}>
                  {t("common.cancel")}
                </Button>
              </Inline>
              <Input
                placeholder={t("cms.builder.comments.assignOptional") as string}
                className="h-8 text-sm"
                value={newAssign}
                onChange={(e) => setNewAssign(e.target.value)}
              />
              <Input
                placeholder={t("cms.builder.comments.initialComment") as string}
                className="h-8 text-sm"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <Cluster justify="end">
                <Button onClick={() => onCreate(newCompId!, newText.trim(), newAssign || undefined)} disabled={!newCompId || !newText.trim()}>
                  {t("common.create")}
                </Button>
              </Cluster>
            </div>
          ) : (
            <Cluster alignY="center" justify="between">
              <div className="text-xs text-muted-foreground">{t("cms.builder.comments.hint.pinOnCanvas")}</div>
              <Button className="h-7 px-2 text-xs" onClick={() => setNewOpen(true)}>
                {t("cms.builder.comments.newThread")}
              </Button>
            </Cluster>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">{t("cms.builder.comments.noThreads")}</div>
        ) : (
          <ul>
            {filtered.map((thr) => {
              // i18n-exempt -- TECH-000 [ttl=2025-10-28] styling only; no user-facing copy in this line
              const rowClass = `border-b p-2 text-sm hover:bg-surface-3 ${selectedId === thr.id ? "bg-surface-2" : ""} ${flashId === thr.id ? "animate-pulse ring-2 ring-primary" : ""}`;
              return (
                <li
                  key={thr.id}
                  ref={(el) => {
                    rowsRef.current[thr.id] = el;
                  }}
                  className={rowClass}
                >
                  <button
                    type="button"
                    className="block w-full min-h-10 min-w-10 cursor-pointer text-start"
                    onClick={() => onSelect(thr.id)}
                  >
                  {/** i18n-exempt */}
                  <Cluster alignY="center" justify="between">
                    <div className="truncate font-medium">{thr.componentId}</div>
                    <div className={`ms-2 shrink-0 rounded px-1 text-xs ${thr.resolved ? "bg-success-soft" : "bg-warning-soft"}`}>
                      {thr.resolved ? (t("cms.builder.comments.resolved") as string) : (t("cms.builder.comments.open") as string)}
                    </div>
                  </Cluster>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{thr.messages[0]?.text ?? (t("cms.builder.comments.emptyMessage") as string)}</div>
                  <Cluster className="mt-1 text-xs text-muted-foreground" justify="between">
                    <span>{thr.assignedTo ? `@${thr.assignedTo}` : (t("cms.builder.comments.unassigned") as string)}</span>
                    <span>{formatTime(thr.updatedAt ?? thr.createdAt)}</span>
                  </Cluster>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Stack>
  );
}
