"use client";

import type React from "react";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";

import { getCsrfToken } from "@acme/lib/security";

import { LinkText } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";
import { Button, Input, Textarea } from "@acme/design-system/shadcn";

import type { CommentThread } from "./CommentsDrawer";

// i18n-exempt — internal editor UI; strings are minimal and not end-user content
/* i18n-exempt */
const t = (s: string) => s;

function formatTime(ts?: string) {
  try {
    return ts ? new Date(ts).toLocaleString() : "";
  } catch {
    return ts ?? "";
  }
}

function renderMessage(text: string) {
  type TextPart = { kind: "text"; start: number; text: string };
  type ImgPart = { kind: "img"; start: number; alt: string; url: string };
  const parts: Array<TextPart | ImgPart> = [];
  const imgRe = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRe.exec(text))) {
    const [full, alt, url] = match;
    if (match.index > lastIndex) parts.push({ kind: "text", start: lastIndex, text: text.slice(lastIndex, match.index) });
    parts.push({ kind: "img", start: match.index, alt, url });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push({ kind: "text", start: lastIndex, text: text.slice(lastIndex) });

  const linkRe = /(https?:\/\/[^\s]+)/g;
  const nodes = parts.flatMap((p) => {
    if (p.kind === "img") {
      // Constrain via fixed-height container and use Next/Image fill+contain
      return (
        <div key={`img-${p.start}-${p.url}`} className="my-1 relative w-full h-48 overflow-hidden rounded border">
          <Image src={p.url} alt={p.alt || "image"} fill className="object-contain" />
        </div>
      );
    }
    const chunks: (string | React.ReactElement)[] = [];
    let li = 0, m: RegExpExecArray | null;
    while ((m = linkRe.exec(p.text))) {
      const [full, url] = m;
      if (m.index > li) chunks.push(p.text.slice(li, m.index));
      chunks.push(
        <LinkText key={`a-${p.start + m.index}`} href={url} target="_blank" rel="noreferrer">
          {full}
        </LinkText>
      );
      li = m.index + full.length;
    }
    if (li < p.text.length) chunks.push(p.text.slice(li));
    return <span key={`t-${p.start}`}>{chunks}</span>;
  });
  return nodes;
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
      <div className="hidden h-full w-full items-center justify-center p-6 text-center text-sm text-muted-foreground md:flex">
        <div>
          <div className="mb-2 text-base font-medium">{t("Select a thread")}</div>
          <div>{t("Choose a comment from the list to view details.")}</div>
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
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/media?shop=${encodeURIComponent(shop)}`, {
        method: "POST",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
        body: data,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t("Upload failed"));
      const url = json?.url as string | undefined;
      if (url) {
        setDraft((prev) => (prev ? `${prev}\n![screenshot](${url})` : `![screenshot](${url})`));
      }
    } catch (err) {
      console.error(t("Screenshot upload failed"), err);
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

  const thr = thread as CommentThread;

  async function handleSend() {
    if (!draft.trim()) return;
    await onAddMessage(thr.id, draft.trim());
    setDraft("");
  }
  return (
    <div className="hidden h-full w-full flex-col md:flex">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="flex-1 min-w-0 truncate text-sm">
          <span className="text-muted-foreground">{t("Component:")}</span> <code className="text-xs">{thr.componentId}</code>
        </div>
        {onJumpTo && (
          <Button variant="outline" className="px-3 text-xs min-h-10 min-w-10" onClick={() => onJumpTo(thr.componentId)}>
            {t("Jump")}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="outline"
            className="px-3 text-xs min-h-10 min-w-10"
            onClick={async () => {
              if (confirm(t("Delete this thread?"))) {
                await onDelete(thr.id);
              }
            }}
          >
            {t("Delete")}
          </Button>
        )}
        <label className="ms-1 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={thr.resolved} onChange={(e) => onToggleResolved(thr.id, e.target.checked)} />
          {t("Resolved")}
        </label>
      </div>
      <Inline gap={2} className="border-b p-2">
        {/* i18n-exempt */}
        {(() => { const LIST_ID = "comment-people" as const; return (<>
        <Input
          /* i18n-exempt */
          placeholder={t("Assign to (name or email)")}
          className="h-8 text-sm"
          value={assignTo}
          onChange={(e) => setAssignTo(e.target.value)}
          onBlur={() => void onAssign(thr.id, assignTo || null)}
          list={LIST_ID}
        />
        <datalist id={LIST_ID}>
          {people.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        </>); })()}
      </Inline>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
        {thr.messages.map((m) => (
          <div key={m.id} className="rounded border p-2">
            <div className="mb-1 text-xs text-muted-foreground">{formatTime(m.ts)}</div>
            <div className="break-words">{renderMessage(m.text)}</div>
          </div>
        ))}
        {thr.messages.length === 0 && (
          <div className="text-muted-foreground">{t("No messages")}</div>
        )}
      </div>
      <div className="border-t p-2">
        <div className="relative">
          <Textarea
            placeholder={uploading ? t("Uploading image...") : t("Reply (type @ to mention, paste image to attach)")}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            disabled={uploading}
            className="min-h-20 pr-24"
          />
          {mentionOpen && mentionMatches.length > 0 && (
            <div className="absolute bottom-2 start-2 max-h-40 w-48 overflow-y-auto rounded border border-border-2 bg-surface-2 text-sm shadow">
              {mentionMatches.map((p, idx) => (
                <button
                  key={p}
                  type="button"
                  className={`w-full cursor-pointer px-2 py-1 text-left hover:bg-surface-3 ${idx === mentionIndex ? "bg-surface-3" : ""}`}
                  onMouseDown={(e) => {
                    // Prevent textarea blur before click fires
                    e.preventDefault();
                  }}
                  onClick={() => {
                    insertMention(p);
                  }}
                >
                  @{p}
                </button>
              ))}
            </div>
          )}
          <div className="pointer-events-none absolute end-2 top-2 flex gap-2">
            <div className="pointer-events-auto">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && void uploadScreenshot(e.target.files[0])} />
              <Button variant="outline" className="px-3 text-xs min-h-10 min-w-10" onClick={() => fileRef.current?.click()}>
                {t("Attach")}
              </Button>
            </div>
            <Button variant="default" className="px-3 text-xs min-h-10 min-w-10" onClick={() => void handleSend()} disabled={!draft.trim()}>
              {t("Send")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
