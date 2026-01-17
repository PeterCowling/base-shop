"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";
import type { ApiError } from "@acme/types";
import ComponentPreview from "@acme/ui/components/ComponentPreview";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum: string;
  newChecksum: string;
}

export default function UpgradePreviewPage() {
  const t = useTranslations();
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/upgrade-changes");
        const data = (await res.json()) as
          | { components: UpgradeComponent[]; pages?: string[] }
          | ApiError;
        if ("error" in data) throw new Error(data.error);
        setChanges(data.components);
        if (Array.isArray(data.pages)) {
          const pageLinks = (
            await Promise.all(
              data.pages.map(async (id: string) => {
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
        console.error(
          "Failed to load upgrade changes", // i18n-exempt -- ABC-123 [ttl=2025-12-31] dev log only
          err,
        );
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
      console.error("Publish failed", err); // i18n-exempt -- ABC-123 [ttl=2025-12-31] dev log only
      setError(err instanceof Error ? err.message : (t("upgrade.publishFailed") as string));
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
          <h2 className="font-semibold">{t("upgrade.previewPages")}</h2>
          <ul className="list-disc pl-4">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  className="text-blue-600 underline inline-block min-h-11 min-w-11"
                >
                  {/* i18n-exempt -- ABC-123 [ttl=2025-12-31] path label for preview */}
                  {`/preview/${l.id}`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handlePublish}
        className="rounded border px-4 py-2 min-h-11 min-w-11"
        disabled={publishing}
      >
        {publishing ? t("upgrade.publishing") : t("upgrade.approveAndPublish")}
      </button>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
