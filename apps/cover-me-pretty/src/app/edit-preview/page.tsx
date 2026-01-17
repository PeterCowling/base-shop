"use client";

import { useEffect, useState } from "react";
import ComponentPreview from "@acme/ui/components/ComponentPreview";

interface UpgradeComponent {
  file: string;
  componentName: string;
  oldChecksum: string;
  newChecksum: string;
}

const exampleProps: Record<string, unknown> = {
  Breadcrumbs: {
    items: [
      { label: "Home", href: "/" }, // i18n-exempt -- ABC-123 example prop for preview only [ttl=2025-06-30]
      { label: "Shop", href: "/shop" }, // i18n-exempt -- ABC-123 example prop for preview only [ttl=2025-06-30]
    ],
  },
};

import { useTranslations } from "@acme/i18n";

export default function EditPreviewPage() {
  const t = useTranslations();
  const [changes, setChanges] = useState<UpgradeComponent[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<{ id: string; url: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/edit-changes");
        const data = (await res.json()) as {
          components: UpgradeComponent[];
          pages?: string[];
        };
        setChanges(data.components);
        if (Array.isArray(data.pages)) {
          const pageLinks = (
            await Promise.all(
              data.pages.map(async (id) => {
                try {
                  const r = await fetch(
                    `/api/preview-token?pageId=${encodeURIComponent(id)}`,
                  );
                  if (!r.ok) return null;
                  const { token } = (await r.json()) as { token: string };
                  return { id, url: `/preview/${id}?upgrade=${token}` };
                } catch {
                  return null;
                }
              }),
            )
          ).filter(Boolean) as { id: string; url: string }[];
          setLinks(pageLinks);
        }
      } catch (err) {
        console.error("Failed to load edit changes", err); // i18n-exempt -- ABC-123 developer diagnostic log [ttl=2025-06-30]
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
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || (t("upgrade.publishFailed") as string));
      }
    } catch (err) {
      console.error("Publish failed", err); // i18n-exempt -- ABC-123 developer diagnostic log [ttl=2025-06-30]
      setError(
        err instanceof Error ? err.message : ((t("upgrade.publishFailed") as string) || "publish_failed")
      );
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
              componentProps={
                (exampleProps[c.componentName] ?? {}) as Record<string, unknown>
              }
            />
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
                  className="inline-flex min-h-11 min-w-11 items-center text-blue-600 underline"
                >
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
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-4"
        disabled={publishing}
      >
        {publishing ? t("upgrade.publishing") : t("upgrade.approveAndPublish")}
      </button>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>
  );
}
