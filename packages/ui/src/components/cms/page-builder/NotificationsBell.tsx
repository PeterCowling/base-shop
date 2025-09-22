"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent, Tooltip } from "../../atoms";
import { BellIcon } from "@radix-ui/react-icons";

export default function NotificationsBell({ shop, pageId }: { shop?: string | null; pageId?: string | null }) {
  const [count, setCount] = React.useState<number>(0);
  const [items, setItems] = React.useState<{ id: string; title: string; ts?: string }[]>([]);
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
        setCount(unresolved.length);
        setItems(unresolved.slice(0, 10).map((t) => ({ id: t.id, title: (t.messages?.[0]?.text || "Comment"), ts: t.updatedAt || t.createdAt })));
      } catch {}
    };
    void load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, [shop, pageId]);

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
      <PopoverContent align="end" className="w-72 text-sm">
        {items.length === 0 ? (
          <div className="text-muted-foreground">No notifications</div>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-auto">
            {items.map((it) => (
              <li key={it.id} className="rounded border px-2 py-1">
                <div className="truncate">{it.title}</div>
                {it.ts && <div className="text-[10px] text-muted-foreground">{new Date(it.ts).toLocaleString()}</div>}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
