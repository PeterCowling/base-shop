import { useCallback } from "react";

import type { Thread, ThreadMessage } from "./types";

export function useCommentsApi(shop: string, pageId: string) {
  const loadThreads = useCallback(async (): Promise<Thread[]> => {
    const res = await fetch(`/api/comments/${shop}/${pageId}`);
    const json = (await res.json()) as unknown;
    const arr = Array.isArray(json) ? json : [];
    return arr.map((item) => {
      const t = item as Record<string, unknown>;
      const posRaw = t["pos"];
      const pos =
        posRaw && typeof posRaw === "object"
          ? {
              x: Number((posRaw as Record<string, unknown>).x) || 0,
              y: Number((posRaw as Record<string, unknown>).y) || 0,
            }
          : null;

      const messages = Array.isArray(t["messages"]) ? (t["messages"] as ThreadMessage[]) : [];

      return {
        id: String(t["id"] ?? ""),
        componentId: String(t["componentId"] ?? ""),
        resolved: Boolean(t["resolved"]),
        assignedTo: t["assignedTo"] != null ? String(t["assignedTo"]) : null,
        messages,
        pos,
        createdAt: typeof t["createdAt"] === "string" ? (t["createdAt"] as string) : undefined,
        updatedAt: typeof t["updatedAt"] === "string" ? (t["updatedAt"] as string) : undefined,
      } as Thread;
    });
  }, [shop, pageId]);

  const patchThread = useCallback(async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/comments/${shop}/${pageId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, [shop, pageId]);

  const deleteThread = useCallback(async (id: string) => {
    await fetch(`/api/comments/${shop}/${pageId}/${id}`, { method: "DELETE" });
  }, [shop, pageId]);

  const createThread = useCallback(
    async (componentId: string, text: string, extra?: { assignedTo?: string | null; pos?: { x: number; y: number } }) => {
      const res = await fetch(`/api/comments/${shop}/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId, text, assignedTo: extra?.assignedTo ?? undefined, pos: extra?.pos ?? undefined }),
      });
      const json = await res.json();
      return { ok: res.ok, json } as { ok: boolean; json: unknown };
    },
    [shop, pageId]
  );

  return { loadThreads, patchThread, deleteThread, createThread };
}
