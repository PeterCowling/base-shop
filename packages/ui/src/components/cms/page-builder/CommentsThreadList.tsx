"use client";

import * as React from "react";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
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
  threads,
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

  return (
    <div className="flex h-full w-full flex-col border-r">
      <div className="flex items-center gap-2 border-b p-2">
        <div className="flex gap-1">
          {(["all", "open", "resolved", "assigned"] as ThreadFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => onFilterChange(f)}
            >
              {f === "all" ? "All" : f === "open" ? "Open" : f === "resolved" ? "Resolved" : "Assigned"}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="ml-auto h-7 w-32 text-xs"
        />
      </div>

      {onCreate && (
        <div className="border-b p-2">
          {newOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Select value={newCompId} onValueChange={(v) => setNewCompId(v)}>
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder="Select component" />
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
                  Cancel
                </Button>
              </div>
              <Input
                placeholder="Assign (optional)"
                className="h-8 text-sm"
                value={newAssign}
                onChange={(e) => setNewAssign(e.target.value)}
              />
              <Input
                placeholder="Initial comment"
                className="h-8 text-sm"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={() => onCreate(newCompId!, newText.trim(), newAssign || undefined)} disabled={!newCompId || !newText.trim()}>
                  Create
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Alt+Click on canvas to pin</div>
              <Button className="h-7 px-2 text-xs" onClick={() => setNewOpen(true)}>
                New thread
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">No threads</div>
        ) : (
          <ul>
            {filtered.map((t) => (
              <li
                key={t.id}
                className={`cursor-pointer border-b p-2 text-sm hover:bg-muted/40 ${selectedId === t.id ? "bg-muted/60" : ""} ${flashId === t.id ? "animate-pulse ring-2 ring-sky-400" : ""}`}
                onClick={() => onSelect(t.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="truncate font-medium">{t.componentId}</div>
                  <div className={`ml-2 shrink-0 rounded px-1 text-[10px] ${t.resolved ? "bg-green-200" : "bg-amber-200"}`}>
                    {t.resolved ? "Resolved" : "Open"}
                  </div>
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{t.messages[0]?.text ?? "(no message)"}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t.assignedTo ? `@${t.assignedTo}` : "Unassigned"}</span>
                  <span>{formatTime(t.updatedAt ?? t.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
