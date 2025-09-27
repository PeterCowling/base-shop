"use client";

// i18n-exempt — CMS editor-only list; copy is minimal and not end-user facing

import * as React from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import { Stack } from "../../atoms/primitives/Stack";
import { Inline } from "../../atoms/primitives/Inline";
import { Cluster } from "../../atoms/primitives/Cluster";
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

  // i18n-exempt — CMS editor-only panel; copy is minimal and non-user facing
  /* i18n-exempt */
  const t = (s: string) => s;

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
              {f === "all" ? t("All") : f === "open" ? t("Open") : f === "resolved" ? t("Resolved") : t("Assigned")}
            </Button>
          ))}
        </Inline>
        <Input
          placeholder={t("Search...") as string}
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
                      <SelectValue placeholder={t("Select component") as string} />
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
                  {t("Cancel")}
                </Button>
              </Inline>
              <Input
                placeholder={t("Assign (optional)") as string}
                className="h-8 text-sm"
                value={newAssign}
                onChange={(e) => setNewAssign(e.target.value)}
              />
              <Input
                placeholder={t("Initial comment") as string}
                className="h-8 text-sm"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <Cluster justify="end">
                <Button onClick={() => onCreate(newCompId!, newText.trim(), newAssign || undefined)} disabled={!newCompId || !newText.trim()}>
                  {t("Create")}
                </Button>
              </Cluster>
            </div>
          ) : (
            <Cluster alignY="center" justify="between">
              <div className="text-xs text-muted-foreground">{t("Alt+Click on canvas to pin")}</div>
              <Button className="h-7 px-2 text-xs" onClick={() => setNewOpen(true)}>
                {t("New thread")}
              </Button>
            </Cluster>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">{t("No threads")}</div>
        ) : (
          <ul>
            {filtered.map((thr) => {
              // i18n-exempt — styling only; no user-facing copy in this line
              const rowClass = `cursor-pointer border-b p-2 text-sm hover:bg-surface-3 ${selectedId === thr.id ? "bg-surface-2" : ""} ${flashId === thr.id ? "animate-pulse ring-2 ring-primary" : ""}`; // i18n-exempt
              return (
              <li
                key={thr.id}
                ref={(el) => {
                  rowsRef.current[thr.id] = el;
                }}
                className={rowClass}
                onClick={() => onSelect(thr.id)}
              >
                {/** i18n-exempt */}
                <Cluster alignY="center" justify="between">
                  <div className="truncate font-medium">{thr.componentId}</div>
                  <div className={`ms-2 shrink-0 rounded px-1 text-xs ${thr.resolved ? "bg-success-soft" : "bg-warning-soft"}`}>
                    {thr.resolved ? (t("Resolved") as string) : (t("Open") as string)}
                  </div>
                </Cluster>
                <div className="mt-1 truncate text-xs text-muted-foreground">{thr.messages[0]?.text ?? (t("(no message)") as string)}</div>
                <Cluster className="mt-1 text-xs text-muted-foreground" justify="between">
                  <span>{thr.assignedTo ? `@${thr.assignedTo}` : (t("Unassigned") as string)}</span>
                  <span>{formatTime(thr.updatedAt ?? thr.createdAt)}</span>
                </Cluster>
              </li>
            );})}
          </ul>
        )}
      </div>
    </Stack>
  );
}
