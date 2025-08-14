"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  type UpgradeComponent,
  upgradeComponentSchema,
} from "@acme/types/upgrade";
import ComponentPreview from "@ui/src/components/ComponentPreview";

const exampleProps: Record<string, any> = {
  Breadcrumbs: {
    items: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
    ],
  },
};

export default function EditPreviewPage() {
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/edit-changes");
        const schema = z.object({
          components: z.array(upgradeComponentSchema),
          pages: z.array(z.string()).optional(),
        });
        const data = schema.parse(await res.json());
        setChanges(data.components);
        if (data.pages) {
          const pageLinks = (
            await Promise.all(
              data.pages.map(async (id) => {
                try {
                  const r = await fetch(
                    `/api/preview-token?pageId=${encodeURIComponent(id)}`,
                  );
                  if (!r.ok) return null;
                  const tokenData = await r.json();
                  if (
                    typeof tokenData === "object" &&
                    tokenData &&
                    "token" in tokenData &&
                    typeof (tokenData as { token?: unknown }).token === "string"
                  ) {
                    return { id, url: `/preview/${id}?upgrade=${tokenData.token}` };
                  }
                  return null;
                } catch {
                  return null;
                }
              }),
            )
          ).filter((l): l is { id: string; url: string } => Boolean(l));
          setLinks(pageLinks);
        }
      } catch (err) {
        console.error("Failed to load edit changes", err);
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
        const data: unknown = await res
          .json()
          .catch(() => ({} as unknown));
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Publish failed";
        throw new Error(message);
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
      <ul className="space-y-4">
        {changes.map((c) => (
          <li key={c.file}>
            <ComponentPreview
              component={c}
              componentProps={exampleProps[c.componentName] ?? {}}
            />
          </li>
        ))}
      </ul>
      {links.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">Preview pages</h2>
          <ul className="list-disc pl-4">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  className="text-blue-600 underline"
                >{`/preview/${l.id}`}</a>
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
