import type { PageComponent, HistoryState } from "@acme/types";

export interface VersionEntry {
  id: string;
  label: string;
  timestamp: string;
  components: PageComponent[];
  editor?: HistoryState["editor"];
}

export async function fetchVersions(shop: string, pageId: string): Promise<VersionEntry[]> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}`);
  if (!res.ok) throw new Error(`Failed to fetch versions: ${res.status}`);
  return (await res.json()) as VersionEntry[];
}

export async function createVersionApi(params: {
  shop: string;
  pageId: string;
  label: string;
  components: PageComponent[];
  editor?: HistoryState["editor"];
}): Promise<void> {
  const { shop, pageId, label, components, editor } = params;
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, components, editor }),
  });
  if (!res.ok) throw new Error(`Failed to save version: ${res.status}`);
}

export async function renameVersion(shop: string, pageId: string, versionId: string, label: string): Promise<void> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${versionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(`Failed to rename: ${res.status}`);
}

export async function deleteVersion(shop: string, pageId: string, versionId: string): Promise<void> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${versionId}`, {
    method: "DELETE",
  });
  if (!(res.status === 204)) throw new Error(`Failed to delete: ${res.status}`);
}

export async function createExperimentApi(shop: string, pageId: string, versionId: string, params: { label?: string; splitA: number }): Promise<void> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${versionId}/experiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Failed to create experiment: ${res.status}`);
}

export async function schedulePublishApi(shop: string, pageId: string, versionId: string, publishAt: string): Promise<void> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${versionId}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publishAt }),
  });
  if (!res.ok) throw new Error(`Failed to schedule publish: ${res.status}`);
}

export async function createPreviewLinkApi(shop: string, pageId: string, versionId: string, password?: string): Promise<string> {
  const res = await fetch(`/cms/api/page-versions/${shop}/${pageId}/${versionId}/preview-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`Failed to create preview link: ${res.status}`);
  const data = (await res.json()) as { url: string };
  return data.url;
}

