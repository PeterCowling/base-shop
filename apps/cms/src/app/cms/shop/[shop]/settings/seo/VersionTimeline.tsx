// apps/cms/src/app/cms/shop/[shop]/settings/seo/VersionTimeline.tsx
"use client";

import { useEffect, useState } from "react";
import { revertSeo } from "@cms/actions/shops.server";

import { formatTimestamp } from "@acme/date-utils";
import en from "@acme/i18n/en.json";
import { useTranslations } from "@acme/i18n/Translations";
import type { SettingsDiffEntry } from "@acme/platform-core/repositories/settings.server";
import { diffHistory } from "@acme/platform-core/repositories/settings.server";
import { CodeBlock } from "@acme/ui/components/molecules";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/shadcn";

interface VersionTimelineProps {
  /** Shop identifier */
  shop: string;
  /** Trigger element for opening the timeline drawer */
  trigger: React.ReactNode;
}

/**
 * Drawer that lists past settings changes and lets an admin revert
 * the shop settings back to a previous state.
 */
export default function VersionTimeline({
  shop,
  trigger,
}: VersionTimelineProps) {
  const tFromContext = useTranslations();
  // Ensure readable strings in tests even without a provider
  const t = (key: string) => {
    const out = tFromContext(key) as unknown as string;
    return out === key ? (en as Record<string, string>)[key] ?? key : out;
  };
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SettingsDiffEntry[]>([]);

  /** Fetch history when drawer opens */
  useEffect(() => {
    if (!open) return;
    diffHistory(shop)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [open, shop]);

  /** Revert to a specific timestamp and then refresh history */
  async function handleRevert(timestamp: string) {
    await revertSeo(shop, timestamp);
    const next = await diffHistory(shop);
    setHistory(next);
  }

  /** Oldest first ‑ ensures the first “Revert” button is the oldest diff */
  const ordered = [...history].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* Positioned ancestor for fixed drawer (lint: ds/absolute-parent-guard) */}
      <div className="relative">
        <DialogContent
          className={
            `bg-surface-3 fixed top-0 end-0 h-full w-96 ` +
            `${open ? "translate-x-0" : "translate-x-full"} ` +
            `overflow-y-auto border-s p-6 shadow-elevation-3 transition-transform`
          }
        >
          <DialogTitle className="mb-4">{String(t("cms.seo.versionHistory.title"))}</DialogTitle>

          <div className="space-y-4 text-sm">
            {ordered.length === 0 ? (
              <p className="text-muted-foreground">{String(t("cms.seo.versionHistory.empty"))}</p>
            ) : (
              <ul className="space-y-4">
                {ordered.map((entry) => (
                  <li key={entry.timestamp} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 font-mono text-xs text-muted-foreground">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <Button
                        variant="outline"
                        className="shrink-0"
                        onClick={() => handleRevert(entry.timestamp)}
                      >
                        {String(t("actions.revert"))}
                      </Button>
                    </div>
                    <CodeBlock
                      code={JSON.stringify(entry.diff, null, 2)}
                      preClassName="text-xs"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
