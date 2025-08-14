"use client";

import { useEffect, useState } from "react";

interface UpgradeComponent {
  file: string;
  componentName: string;
}

export default function UpgradePreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as {
          components: UpgradeComponent[];
          pages?: string[];
        };
        setChanges(data.components);
        const pageIds = data.pages ?? [];
        setPages(pageIds);
        await Promise.all(
          pageIds.map(async (id) => {
            try {
              const tokenRes = await fetch(
                `/api/preview-token?pageId=${encodeURIComponent(id)}`,
              );
              const tokenData = (await tokenRes.json()) as { token: string };
              setTokens((t) => ({ ...t, [id]: tokenData.token }));
            } catch (err) {
              console.error("Failed to fetch preview token", err);
            }
          }),
        );
      } catch (err) {
        console.error("Failed to load upgrade changes", err);
      }
    }
    void load();
  }, []);

  async function handlePublish() {
    try {
      await fetch("/api/publish", { method: "POST" });
    } catch (err) {
      console.error("Publish failed", err);
    }
  }

  return (
    <div className="space-y-8">
      <ul className="list-disc pl-4">
        {changes.map((c) => (
          <li key={c.file}>{c.componentName}</li>
        ))}
      </ul>
      <ul className="list-disc pl-4">
        {pages.map((id) => (
          <li key={id}>
            {tokens[id] ? (
              <a href={`/preview/${id}?upgrade=${tokens[id]}`}>{`Preview ${id}`}</a>
            ) : (
              id
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handlePublish}
        className="rounded border px-4 py-2"
      >
        Approve &amp; publish
      </button>
    </div>
  );
}

