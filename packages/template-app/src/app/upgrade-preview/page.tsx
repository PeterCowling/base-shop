"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface UpgradeComponent {
  name: string;
  before: {
    path: string;
    props?: Record<string, unknown>;
  };
  after: {
    path: string;
    props?: Record<string, unknown>;
  };
}

export default function UpgradePreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as UpgradeComponent[];
        setChanges(data);
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
      {changes.map((c) => {
        const Before = dynamic(() => import(c.before.path));
        const After = dynamic(() => import(c.after.path));
        return (
          <div key={c.name} className="space-y-2">
            <h2 className="text-lg font-semibold">{c.name}</h2>
            <div className="flex gap-4">
              <div className="flex-1 border p-2">
                <Before {...c.before.props} />
              </div>
              <div className="flex-1 border p-2">
                <After {...c.after.props} />
              </div>
            </div>
          </div>
        );
      })}
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

