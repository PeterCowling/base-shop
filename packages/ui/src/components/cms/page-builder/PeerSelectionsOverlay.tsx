"use client";

import { Fragment } from "react";
import type { PresencePeer } from "./collab/usePresence";
import type { Rect } from "./utils/coords";

export default function PeerSelectionsOverlay({ peers, positions }: { peers: PresencePeer[]; positions: Record<string, Rect> }) {
  if (!peers.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {peers.map((p) => (
        <Fragment key={p.id}>
          {(p.selectedIds || []).map((cid) => {
            const box = positions[cid];
            if (!box) return null;
            return (
              <div
                key={`${p.id}:${cid}`}
                className="absolute rounded"
                style={{
                  left: box.left,
                  top: box.top,
                  width: box.width,
                  height: box.height,
                  outline: `2px solid ${p.color}`,
                  outlineOffset: "2px",
                  boxShadow: `inset 0 0 0 1px ${p.color}66`,
                }}
                title={`${p.label} selected`}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

