"use client";

import { useEffect, useState } from "react";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum: string;
  newChecksum: string;
}

export default function UpgradePreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as {
          components: UpgradeComponent[];
        };
        setChanges(data.components);
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
