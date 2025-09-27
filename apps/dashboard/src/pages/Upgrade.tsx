"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { UpgradeComponent } from "@acme/types/upgrade";
import { useTranslations } from "@acme/i18n";

interface ComponentGroups {
  [group: string]: UpgradeComponent[];
}

export default function Upgrade() {
  const router = useRouter();
  const { id } = router.query;
  const t = useTranslations();
  const [groups, setGroups] = useState<ComponentGroups>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/shop/${id}/component-diff`);
        if (!res.ok) throw new Error("Failed to load component diff"); // i18n-exempt: developer-only error string, not shown to users
        const data = (await res.json()) as ComponentGroups;
        setGroups(data);
      } catch (err) {
        console.error("Failed to load component diff", err); // i18n-exempt: developer debug log label
      }
    }
    void load();
  }, [id]);

  function toggle(file: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }

  async function publish() {
    if (!id) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/shop/${id}/publish-upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components: Array.from(selected) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("success");
      setMessage(String(t("upgrade.publish.success")));
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : String(t("upgrade.publish.failed"))
      );
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, components]) => (
        <div key={group} className="space-y-2">
          <h2 className="font-semibold capitalize">{group}</h2>
          <ul className="space-y-1">
            {components.map((c) => (
              <li key={c.file}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(c.file)}
                    onChange={() => toggle(c.file)}
                  />
                  {c.componentName}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {selected.size > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold">{t("upgrade.selectedComponents")}</h2>
          <ul className="list-disc pl-4">
            {Array.from(selected).map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
          <button
            onClick={publish}
            disabled={status === "loading"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded bg-blue-600 px-4 py-2 text-white"
          >
            {status === "loading"
              ? t("upgrade.publishing")
              : t("upgrade.publishCta")}
          </button>
          {status === "success" && (
            <p className="text-green-600">{message}</p>
          )}
          {status === "error" && (
            <p className="text-red-600">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
