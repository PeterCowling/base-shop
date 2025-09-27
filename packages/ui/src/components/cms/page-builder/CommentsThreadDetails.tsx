"use client";

import { useMemo, useRef, useState } from "react";
import type React from "react";
import { Button, Input, Textarea } from "../../atoms/shadcn";
import type { CommentThread } from "./CommentsDrawer";

function formatTime(ts?: string) {
  try {
    return ts ? new Date(ts).toLocaleString() : "";
  } catch {
    return ts ?? "";
  }
}

function renderMessage(text: string) {
  const parts: (string | { type: "img"; alt: string; url: string })[] = [];
  const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRe.exec(text))) {
    const [full, alt, url] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push({ type: "img", alt, url });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  const linkRe = /(https?:\/\/[^\s]+)/g;
  const nodes = parts.flatMap((p, i) => {
    if (typeof p !== "string") {
      return (
        <div key={`img-${i}`} className="my-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={p.alt || "image"} className="max-h-48 rounded border" />
        </div>
      );
    }
    const chunks: (string | React.ReactElement)[] = [];
    let li = 0, m: RegExpExecArray | null;
    while ((m = linkRe.exec(p))) {
      const [full, url] = m;
      if (m.index > li) chunks.push(p.slice(li, m.index));
      chunks.push(
        <a key={`a-${i}-${m.index}`} href={url} target="_blank" rel="noreferrer" className="text-sky-600 underline">
          {full}
        </a>
      );
      li = m.index + full.length;
    }
    if (li < p.length) chunks.push(p.slice(li));
    return <span key={`t-${i}`}>{chunks}</span>;
  });
  return <>{nodes}</>;
}

export interface CommentsThreadDetailsProps {
  thread: CommentThread | null;
  people: string[];
  onToggleResolved: (id: string, resolved: boolean) => Promise<void> | void;
  onAssign: (id: string, assignee: string | null) => Promise<void> | void;
  onAddMessage: (id: string, text: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onJumpTo?: (componentId: string) => void;
  shop: string;
}

export default function CommentsThreadDetails({
  thread,
  people,
  onToggleResolved,
  onAssign,
  onAddMessage,
  onDelete,
  onJumpTo,
  shop,
}: CommentsThreadDetailsProps) {
  const [assignTo, setAssignTo] = useState("");
  const [draft, setDraft] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionMatches = useMemo(() => {
    if (!mentionOpen) return [] as string[];
    const q = mentionQuery.toLowerCase();
    return people.filter((p) => p.toLowerCase().includes(q)).slice(0, 5);
  }, [mentionOpen, mentionQuery, people]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!thread) {
    return (
      <div className="hidden h-full w-full md:w-[28rem] items-center justify-center p-6 text-center text-sm text-muted-foreground md:flex">
        <div>
          <div className="mb-2 text-base font-medium">Select a thread</div>
          <div>Choose a comment from the list to view details.</div>
        </div>
      </div>
    );
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    const m = /(^|\s)@([A-Za-z0-9._-]*)$/.exec(value.slice(0));
    if (m) {
      setMentionOpen(true);
      setMentionQuery(m[2] ?? "");
      setMentionIndex(0);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  }

  function insertMention(handle: string) {
    const idx = draft.lastIndexOf("@" + mentionQuery);
    const before = idx >= 0 ? draft.slice(0, idx) : draft + " ";
    const after = idx >= 0 ? draft.slice(idx + 1 + mentionQuery.length) : "";
    const next = `${before}@${handle}${after}`;
    setDraft(next);
    setMentionOpen(false);
    setMentionQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!mentionOpen || mentionMatches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((i) => Math.min(mentionMatches.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const handle = mentionMatches[mentionIndex] ?? mentionMatches[0];
      if (handle) insertMention(handle);
    } else if (e.key === "Escape") {
      setMentionOpen(false);
    }
  }

  async function uploadScreenshot(file: File) {
    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`/cms/api/media?shop=${encodeURIComponent(shop)}`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      const url = json?.url as string | undefined;
      if (url) {
        setDraft((prev) => (prev ? `${prev}\n![screenshot](${url})` : `![screenshot](${url})`));
      }
    } catch (err) {
      console.error("Screenshot upload failed", err);
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && file.type.startsWith("image/")) {
          void uploadScreenshot(file);
          e.preventDefault();
          return;
        }
      }
    }
  }

  const t = thread as CommentThread;

  async function handleSend() {
    if (!draft.trim()) return;
    await onAddMessage(t.id, draft.trim());
    setDraft("");
  }
  return (
    <div className="hidden h-full w-full md:w-[28rem] flex-col md:flex">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="flex-1 min-w-0 truncate text-sm">
          <span className="text-muted-foreground">Component:</span> <code className="text-xs">{t.componentId}</code>
        </div>
        {onJumpTo && (
          <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => onJumpTo(t.componentId)}>
            Jump
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={async () => {
              if (confirm("Delete this thread?")) {
                await onDelete(t.id);
              }
            }}
          >
            Delete
          </Button>
        )}
        <label className="ms-1 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={t.resolved} onChange={(e) => onToggleResolved(t.id, e.target.checked)} />
          Resolved
        </label>
      </div>
      <div className="flex items-center gap-2 border-b p-2">
        <Input
          placeholder="Assign to (name or email)"
          className="h-8 text-sm"
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          onBlur={() => void onAssign(t.id, assignTo || null)}
          list="comment-people"
        />
        <datalist id="comment-people">
          {people.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {t.messages.map((m) => (
          <div key={m.id} className="rounded border p-2">
            <div className="mb-1 text-xs text-muted-foreground">{formatTime(m.ts)}</div>
            <div className="break-words">{renderMessage(m.text)}</div>
          </div>
        ))}
        {t.messages.length === 0 && (
          <div className="text-muted-foreground">No messages</div>
        )}
      </div>
      <div className="border-t p-2">
        <div className="relative">
          <Textarea
            placeholder={uploading ? "Uploading image..." : "Reply (type @ to mention, paste image to attach)"}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            disabled={uploading}
            className="min-h-[5rem] pr-24"
          />
          {mentionOpen && mentionMatches.length > 0 && (
            <div className="absolute bottom-2 start-2 z-10 max-h-40 w-48 overflow-y-auto rounded border border-border-2 bg-surface-2 text-sm shadow">
              {mentionMatches.map((p, idx) => (
                <div
                  key={p}
                  className={`cursor-pointer px-2 py-1 hover:bg-surface-3 ${idx === mentionIndex ? "bg-surface-3" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(p);
                  }}
                >
                  @{p}
                </div>
              ))}
            </div>
          )}
          <div className="pointer-events-none absolute end-2 top-2 flex gap-2">
            <div className="pointer-events-auto">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && void uploadScreenshot(e.target.files[0])} />
              <Button variant="outline" className="h-8 px-2 text-xs" onClick={() => fileRef.current?.click()}>
                Attach
              </Button>
            </div>
            <Button variant="default" className="h-8 px-2 text-xs" onClick={() => void handleSend()} disabled={!draft.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
