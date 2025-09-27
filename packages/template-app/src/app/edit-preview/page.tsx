"use client";

import { useEffect, useState } from "react";
import type { ApiError } from "@acme/types";
import ComponentPreview from "@ui/src/components/ComponentPreview";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum: string;
  newChecksum: string;
}

export default function EditPreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/edit-changes");
        const data = (await res.json()) as
          | { components: UpgradeComponent[]; pages?: string[] }
          | ApiError;
        if ("error" in data) throw new Error(data.error);
        setChanges(data.components);
        if (Array.isArray(data.pages)) {
          const pageLinks = (
            await Promise.all(
              (data.pages as string[]).map(async (id) => {
                try {
                  const r = await fetch(
                    `/api/preview-token?pageId=${encodeURIComponent(id)}`,
                  );
                  const tokenData = (await r.json()) as
                    | { token: string }
                    | ApiError;
                  if ("error" in tokenData) return null;
                  return { id, url: `/preview/${id}?upgrade=${tokenData.token}` };
                } catch {
                  return null;
                }
              }),
            )
          ).filter(Boolean) as { id: string; url: string }[];
          setLinks(pageLinks);
        }
      } catch (err) {
        console.error("Failed to load edit changes" /* i18n-exempt: developer log */, err);
      }
    }
    void load();
  }, []);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as ApiError;
      if ("error" in data) throw new Error(data.error);
    } catch (err) {
      console.error("Publish failed" /* i18n-exempt: developer log */, err);
      setError(err instanceof Error ? err.message : "Publish failed" /* i18n-exempt: fallback error label */);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-4">
        {changes.map((c) => (
          <li key={c.file}>
            <ComponentPreview component={c} />
          </li>
        ))}
      </ul>
      {links.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">{/* i18n-exempt: developer preview tools */}Preview pages</h2>
          <ul className="list-disc pl-4">
            {links.map((l) => (
              <li key={l.id}>
                <a href={l.url} className="text-blue-600 underline inline-flex min-h-10 min-w-10 items-center">{/* i18n-exempt: path label for preview */}{`/preview/${l.id}`}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={handlePublish}
        className="rounded border px-4 py-2 min-h-10 min-w-10 inline-flex items-center justify-center"
        disabled={publishing}
      >
        {publishing ? (
          // i18n-exempt: developer tool status
          "Publishing..."
        ) : (
          // i18n-exempt: developer tool action
          "Approve & publish"
        )}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
  );
}
