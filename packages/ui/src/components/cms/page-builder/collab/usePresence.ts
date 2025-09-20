"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PresencePeer = {
  id: string;
  label: string;
  color: string;
  selectedIds: string[];
  editingId: string | null;
  ts: number;
};

type PresenceEvent =
  | { type: "join"; id: string; label: string }
  | { type: "leave"; id: string }
  | { type: "update"; id: string; label?: string; selectedIds?: string[]; editingId?: string | null };

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 85% 55%)`;
}

function now() { return Date.now(); }

function makeChannelName(shop: string | null | undefined, pageId: string | null | undefined) {
  return `pb-presence:${shop || ""}:${pageId || ""}`;
}

export function usePresence({
  shop,
  pageId,
  meId,
  label,
  selectedIds,
  editingId,
}: {
  shop: string | null | undefined;
  pageId: string | null | undefined;
  meId: string | null | undefined;
  label: string | null | undefined;
  selectedIds: string[];
  editingId?: string | null;
}) {
  const me = (meId || "anon").slice(0, 200);
  const myLabel = (label || me).slice(0, 200);
  const chanName = makeChannelName(shop, pageId);
  const [peers, setPeers] = useState<Record<string, PresencePeer>>({});
  const bcRef = useRef<BroadcastChannel | null>(null);
  const lastSent = useRef<number>(0);
  const aliveRef = useRef(true);

  // Send a presence packet
  const send = (ev: PresenceEvent) => {
    try {
      const bc = bcRef.current;
      if (bc) bc.postMessage(ev);
    } catch {
      // ignore
    }
  };

  // Setup channel + heartbeats
  useEffect(() => {
    aliveRef.current = true;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(chanName);
      bcRef.current = bc;
    } catch {
      bcRef.current = null;
    }
    if (bc) {
      const onMsg = (e: MessageEvent<PresenceEvent>) => {
        const data = e.data;
        if (!data || typeof data !== "object") return;
        if (data.type === "join") {
          setPeers((prev) => {
            const next = { ...prev };
            if (data.id !== me) {
              next[data.id] = next[data.id] ?? {
                id: data.id,
                label: data.label,
                color: hashColor(data.id),
                selectedIds: [],
                editingId: null,
                ts: now(),
              };
            }
            return next;
          });
          // Greet back with our state
          if (data.id !== me) {
            send({ type: "update", id: me, label: myLabel, selectedIds, editingId: editingId ?? (selectedIds[0] ?? null) });
          }
        } else if (data.type === "leave") {
          setPeers((prev) => {
            const next = { ...prev };
            delete next[data.id];
            return next;
          });
        } else if (data.type === "update") {
          if (data.id === me) return;
          setPeers((prev) => {
            const next = { ...prev };
            const peer = next[data.id] ?? { id: data.id, label: data.label || data.id, color: hashColor(data.id), selectedIds: [], editingId: null, ts: now() };
            if (data.label) peer.label = data.label;
            if (data.selectedIds) peer.selectedIds = Array.isArray(data.selectedIds) ? data.selectedIds : [];
            if ("editingId" in data) peer.editingId = (data.editingId ?? null) as any;
            peer.ts = now();
            next[data.id] = peer;
            return next;
          });
        }
      };
      bc.addEventListener("message", onMsg);
    }

    // Join on mount
    send({ type: "join", id: me, label: myLabel });

    const hb = setInterval(() => {
      if (!aliveRef.current) return;
      const payload: PresenceEvent = { type: "update", id: me, label: myLabel, selectedIds, editingId: editingId ?? (selectedIds[0] ?? null) };
      send(payload);
      lastSent.current = now();
      // GC stale peers
      setPeers((prev) => {
        const t = now();
        const next: typeof prev = {};
        for (const [id, p] of Object.entries(prev)) {
          if (t - (p.ts || 0) < 15000) next[id] = p;
        }
        return next;
      });
    }, 4000);

    return () => {
      aliveRef.current = false;
      try { send({ type: "leave", id: me }); } catch {}
      clearInterval(hb);
      try { bc?.close(); } catch {}
      bcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chanName, me, myLabel]);

  // React to selection/editing changes quickly without waiting for heartbeat
  useEffect(() => {
    const t = now();
    if (t - lastSent.current > 300) {
      send({ type: "update", id: me, label: myLabel, selectedIds, editingId: editingId ?? (selectedIds[0] ?? null) });
      lastSent.current = t;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(","), editingId ?? "none"]);

  const peerList = useMemo(() => Object.values(peers).sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id)), [peers]);
  const softLocksById = useMemo(() => {
    const map = new Map<string, PresencePeer>();
    for (const p of peerList) {
      if (p.editingId) map.set(p.editingId, p);
    }
    return map;
  }, [peerList]);

  return { peers: peerList, softLocksById };
}

export default usePresence;

