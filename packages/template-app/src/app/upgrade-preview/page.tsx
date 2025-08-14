"use client";

import { useEffect, useState } from "react";

interface UpgradeComponent {
  file: string;
  componentName: string;
  pages?: string[];
}

interface PreviewPage {
  id: string;
  token: string;
}

export default function UpgradePreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as {
          components: UpgradeComponent[];
        };
        setChanges(data.components);
        const uniquePageIds = Array.from(
          new Set(
            data.components.flatMap((c) => c.pages ?? [])
          )
        );
        const tokenEntries = await Promise.all(
          uniquePageIds.map(async (id) => {
            const tokenRes = await fetch(`/api/preview-token?pageId=${id}`);
            const json = (await tokenRes.json()) as { token: string };
            return { id, token: json.token };
          })
        );
        setPages(tokenEntries);
      } catch (err) {
        console.error("Failed to load upgrade changes", err);
      }
    }
    void load();
  }, []);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || "Publish failed");
      }
    } catch (err) {
      console.error("Publish failed", err);
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      <ul className="list-disc pl-4">
        {changes.map((c) => (
          <li key={c.file}>{c.componentName}</li>
        ))}
      </ul>
      {pages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Affected pages</h2>
          <ul className="list-disc pl-4">
            {pages.map((p) => (
              <li key={p.id}>
                <a
                  href={`/preview/${p.id}?upgrade=${p.token}`}
                  className="text-blue-600 underline"
                >
                  {p.id}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={handlePublish}
        className="rounded border px-4 py-2"
        disabled={publishing}
      >
        {publishing ? "Publishing..." : "Approve & publish"}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
  );
}

