"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatTimestamp } from "@acme/date-utils";
import { useTranslations } from "@acme/i18n";

import { Skeleton, Toast } from "@/components/atoms";
import { Button,Card, CardContent } from "@/components/atoms/shadcn";

type Status = {
  origin?: string;
  sitemap?: { url: string; lastModified?: string; contentLength?: number };
  aiSitemap?: { url: string; lastModified?: string; contentLength?: number };
  rebuild?: { status?: number; detail?: string };
};

export default function SitemapStatusPanel() {
  const t = useTranslations();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seo/sitemap-status");
      const data = (await res.json()) as Status;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rebuild = async () => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/seo/sitemap-status", { method: "POST" });
      const json = (await res.json()) as Status;
      setStatus((prev) => ({ ...(prev ?? {}), rebuild: { status: res.status, detail: json?.rebuild?.detail } }));
      setToast({
        open: true,
        message: res.ok
          ? String(t("Sitemap rebuild triggered in deploy pipeline"))
          : String(t("Failed to trigger sitemap rebuild")),
      });
      router.refresh();
    } catch {
      setToast({ open: true, message: String(t("Failed to trigger sitemap rebuild")) });
    } finally {
      setRebuilding(false);
    }
  };

  const formatLm = (lm?: string) => (lm ? formatTimestamp(lm) : t("Unknown"));

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold font-sans">{t("Sitemap freshness")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("Check last modified dates for sitemap.xml and ai-sitemap.xml.")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? t("Refreshing…") : t("Refresh")}
              </Button>
              <Button onClick={rebuild} disabled={rebuilding}>
                {rebuilding ? t("Queuing…") : t("Rebuild")}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border/10 p-4">
                <p className="text-xs text-muted-foreground">sitemap.xml</p>
                <p className="text-base font-semibold font-sans">{formatLm(status?.sitemap?.lastModified)}</p>
                <p className="text-xs text-muted-foreground break-all">{status?.sitemap?.url}</p>
              </div>
              <div className="rounded-md border border-border/10 p-4">
                <p className="text-xs text-muted-foreground">ai-sitemap.xml</p>
                <p className="text-base font-semibold font-sans">{formatLm(status?.aiSitemap?.lastModified)}</p>
                <p className="text-xs text-muted-foreground break-all">{status?.aiSitemap?.url}</p>
              </div>
              {status?.rebuild && (
                <div className="rounded-md border border-border/10 p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">{t("Last rebuild trigger")}</p>
                  <p className="text-base font-semibold">
                    {status.rebuild.status ? `${status.rebuild.status}` : t("Unknown")}
                  </p>
                  {status.rebuild.detail && (
                    <p className="text-xs text-muted-foreground break-words">
                      {formatLm(status.rebuild.detail)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </>
  );
}
