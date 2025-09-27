"use client";

import { useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerPortal } from "../../atoms/primitives/drawer";
import { OverlayScrim } from "../../atoms";
import CommentsThreadList from "./CommentsThreadList";
import CommentsThreadDetails from "./CommentsThreadDetails";

export type Message = { id: string; text: string; ts: string; author?: string };
export type CommentThread = {
  id: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
};
export type ThreadFilter = "all" | "open" | "resolved" | "assigned";

export interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: CommentThread[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddMessage: (id: string, text: string) => Promise<void> | void;
  onToggleResolved: (id: string, resolved: boolean) => Promise<void> | void;
  onAssign: (id: string, assignee: string | null) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onJumpTo?: (componentId: string) => void;
  componentsOptions?: { id: string; label: string }[];
  onCreate?: (componentId: string, text: string, assignedTo?: string | null) => Promise<void> | void;
  shop: string;
  me?: string | null;
  /** Optional list of users/handles to power @mentions suggestions. */
  mentionPeople?: string[];
}

// i18n-exempt — editor-only utility; copy is minimal and non-user-facing
/* i18n-exempt */
const t = (s: string) => s;

function extractPeople(threads: CommentThread[], me?: string | null): string[] {
  const set = new Set<string>();
  if (me) set.add(me);
  for (const t of threads) {
    if (t.assignedTo) set.add(t.assignedTo);
    for (const m of t.messages) {
      const re = /@([A-Za-z0-9._-]+)/g;
      let match: RegExpExecArray | null;
      while ((match = re.exec(m.text))) {
        const handle = match[1];
        if (handle) set.add(handle);
      }
    }
  }
  return Array.from(set);
}

export default function CommentsDrawer(props: CommentsDrawerProps) {
  const { open, onOpenChange, threads, selectedId, onSelect, me } = props;
  const [filter, setFilter] = useState<ThreadFilter>("open");
  const [query, setQuery] = useState("");
  const [flashThreadId, setFlashThreadId] = useState<string | null>(null);

  const people = useMemo(
    () => props.mentionPeople && props.mentionPeople.length > 0 ? props.mentionPeople : extractPeople(threads, me),
    [threads, me, props.mentionPeople]
  );
  const selected = threads.find((t) => t.id === selectedId) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => {
        if (filter === "open" && t.resolved) return false;
        if (filter === "resolved" && !t.resolved) return false;
        if (filter === "assigned") {
          const mine = (me ?? "").toLowerCase();
          if (!t.assignedTo) return false;
          if (!mine) return true;
          return t.assignedTo.toLowerCase().includes(mine);
        }
        return true;
      })
      .filter((t) => {
        if (!q) return true;
        const hay = `${t.componentId} ${t.assignedTo ?? ""} ${t.messages
          .map((m) => m.text)
          .join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        const au = a.updatedAt ?? a.createdAt ?? "";
        const bu = b.updatedAt ?? b.createdAt ?? "";
        return au > bu ? -1 : au < bu ? 1 : 0;
      });
  }, [threads, filter, query, me]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent side="right" width="w-96" className="p-0">
        <DrawerTitle className="sr-only">{t("Comments")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("Drawer for viewing, filtering, and managing comment threads.")}
        </DrawerDescription>
        <div className="flex h-full">
          <CommentsThreadList
            threads={threads}
            filtered={filtered}
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
            selectedId={selectedId}
            onSelect={(id) => onSelect(id)}
            onCreate={props.onCreate}
            componentsOptions={props.componentsOptions}
            flashId={flashThreadId}
          />
          <CommentsThreadDetails
            thread={selected}
            people={people}
            onAddMessage={props.onAddMessage}
            onAssign={props.onAssign}
            onToggleResolved={props.onToggleResolved}
            onDelete={props.onDelete}
            onJumpTo={(componentId) => {
              props.onJumpTo?.(componentId);
              if (selected) {
                setFlashThreadId(selected.id);
                setTimeout(() => setFlashThreadId(null), 1200);
              }
            }}
            shop={props.shop}
          />
        </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
