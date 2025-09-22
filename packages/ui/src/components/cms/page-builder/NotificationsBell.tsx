"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent, Tooltip } from "../../atoms";
import { BellIcon } from "@radix-ui/react-icons";

export default function NotificationsBell({ shop, pageId }: { shop?: string | null; pageId?: string | null }) {
  const [count, setCount] = React.useState<number>(0);
  const [items, setItems] = React.useState<{ id: string; title: string; ts?: string; source?: string }[]>([]);
  const [commentCount, setCommentCount] = React.useState<number>(0);
  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!shop || !pageId) return;
        const res = await fetch(`/api/comments/${encodeURIComponent(shop)}/${encodeURIComponent(pageId)}`);
        if (!res.ok) return;
        const list = (await res.json()) as any[];
        if (!active) return;
        const unresolved = list.filter((t) => !t.resolved);
        setCommentCount(unresolved.length);
        setItems((prev) => {
          const fromComments = unresolved.slice(0, 10).map((t) => ({ id: `c:${t.id}`, title: (t.messages?.[0]?.text || "Comment"), ts: t.updatedAt || t.createdAt, source: 'comments' }));
          // Keep existing non-comment events
          const others = prev.filter((p) => p.source !== 'comments');
          const merged = [...fromComments, ...others].slice(0, 50);
          const extra = merged.filter((i) => i.source !== 'comments').length;
          setCount(Math.min(99, (unresolved.length + extra)));
          return merged;
        });
      } catch {}
    };
    void load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [shop, pageId]);

  // Listen to in-app events (live messages + explicit notifications)
  React.useEffect(() => {
    const onLive = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ detail?: string } | string> & { detail?: string };
        const text = (typeof ce.detail === 'string' ? ce.detail : (ce as any)?.detail) || 'Update';
        setItems((prev) => {
          const next = [{ id: `m:${Date.now()}`, title: String(text), ts: new Date().toISOString(), source: 'messages' }, ...prev].slice(0, 50);
          const extra = next.filter((i) => i.source !== 'comments').length;
          setCount(Math.min(99, commentCount + extra));
          return next;
        });
      } catch {}
    };
    const onNotify = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ type?: string; title?: string; message?: string }>;
        const d = ce.detail || {};
        const title = d.title || d.message || 'Event';
        setItems((prev) => {
          const next = [{ id: `e:${Date.now()}`, title: String(title), ts: new Date().toISOString(), source: d.type || 'event' }, ...prev].slice(0, 50);
          const extra = next.filter((i) => i.source !== 'comments').length;
          setCount(Math.min(99, commentCount + extra));
          return next;
        });
      } catch {}
    };
    window.addEventListener('pb-live-message', onLive as EventListener);
    window.addEventListener('pb:notify', onNotify as EventListener);
    return () => {
      window.removeEventListener('pb-live-message', onLive as EventListener);
      window.removeEventListener('pb:notify', onNotify as EventListener);
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip text={count > 0 ? `${count} notifications` : "Notifications"}>
          <button type="button" aria-label="Notifications" className="relative rounded border px-2 py-1 text-sm">
            <BellIcon className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 text-sm">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1">All {count}</span>
          <span className="rounded bg-muted px-1">Comments {commentCount}</span>
          <span className="rounded bg-muted px-1">Events {Math.max(0, count - commentCount)}</span>
        </div>
        {items.length === 0 ? (
          <div className="text-muted-foreground">No notifications</div>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-auto">
            {items.map((it) => (
              <li
                key={it.id}
                className="cursor-pointer rounded border px-2 py-1 hover:bg-muted"
                onClick={() => {
                  if (it.source === 'comments') {
                    const tid = it.id.startsWith('c:') ? it.id.slice(2) : it.id;
                    try { window.dispatchEvent(new CustomEvent('pb:open-comment', { detail: { id: tid } })); } catch {}
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">{it.title}</div>
                  <span className="text-[10px] uppercase text-muted-foreground">{(it.source || 'event')}</span>
                </div>
                {it.ts && <div className="text-[10px] text-muted-foreground">{new Date(it.ts).toLocaleString()}</div>}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
