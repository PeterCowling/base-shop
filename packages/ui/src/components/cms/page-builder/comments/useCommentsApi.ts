import { useCallback } from "react";
import type { Thread } from "./types";

export function useCommentsApi(shop: string, pageId: string) {
  const loadThreads = useCallback(async (): Promise<Thread[]> => {
    const res = await fetch(`/cms/api/comments/${shop}/${pageId}`);
    const data = (await res.json()) as any[];
    return (data || []).map((t) => ({
      id: t.id,
      componentId: t.componentId,
      resolved: !!t.resolved,
      assignedTo: t.assignedTo ?? null,
      messages: t.messages || [],
      pos: t.pos ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }, [shop, pageId]);

  const patchThread = useCallback(async (id: string, body: Record<string, unknown>) => {
    await fetch(`/cms/api/comments/${shop}/${pageId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, [shop, pageId]);

  const deleteThread = useCallback(async (id: string) => {
    await fetch(`/cms/api/comments/${shop}/${pageId}/${id}`, { method: "DELETE" });
  }, [shop, pageId]);

  const createThread = useCallback(
    async (componentId: string, text: string, extra?: { assignedTo?: string | null; pos?: { x: number; y: number } }) => {
      const res = await fetch(`/cms/api/comments/${shop}/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId, text, assignedTo: extra?.assignedTo ?? undefined, pos: extra?.pos ?? undefined }),
      });
      const json = await res.json();
      return { ok: res.ok, json } as { ok: boolean; json: any };
    },
    [shop, pageId]
  );

  return { loadThreads, patchThread, deleteThread, createThread };
}

