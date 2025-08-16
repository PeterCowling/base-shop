import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@auth";
import { useState } from "react";

export const metadata: Metadata = {
  title: "Upgrade Preview · Base-Shop",
};

export default async function UpgradePreview({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  await requirePermission("manage_pages");
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  return <UpgradePreviewClient shop={shop} />;
}

function UpgradePreviewClient({ shop }: { shop: string }) {
  "use client";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/upgrade-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Upgrade failed";
        throw new Error(message);
      }
      window.location.href = `/${shop}/upgrade-preview`;
    } catch (err) {
      console.error("Upgrade failed", err);
      setError(err instanceof Error ? err.message : "Upgrade failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleClick}
        className="rounded border px-4 py-2"
        disabled={loading}
      >
        {loading ? "Upgrading..." : "Upgrade & preview"}
      </button>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
