"use client";

import Link from "next/link";

import { useTranslations } from "@acme/i18n";

import type { CommitHistoryEntry } from "@/lib/git-history";

interface CardHistoryProps {
  history: CommitHistoryEntry[];
  githubUrl?: string;
}

export function CardHistory({ history, githubUrl }: CardHistoryProps) {
  const t = useTranslations();

  // i18n-exempt -- BOS-103 locale constant [ttl=2026-03-31]
  const dateLocale = "en-US";

  if (history.length === 0) {
    return (
      <div className="mt-6 border-t border-border-2 pt-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("businessOs.cardHistory.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("businessOs.cardHistory.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border-2 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t("businessOs.cardHistory.title")}
        </h2>
        {githubUrl && (
          <Link
            href={githubUrl}
            target="_blank"
            rel={
              // i18n-exempt -- BOS-102 security rel attribute [ttl=2026-03-31]
              "noopener noreferrer"
            }
            className="inline-flex min-h-11 min-w-11 items-center px-1 text-sm text-link underline"
          >
            {t("businessOs.cardHistory.viewFull")}
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {history.map((commit) => (
          <div
            key={commit.hash}
            className="flex gap-4 border-l-2 border-border-2 py-2 pl-4 text-sm"
          >
            <div className="flex-1">
              <p className="font-medium text-foreground">{commit.message}</p>
              <p className="mt-1 text-muted-foreground">
                {commit.author} •{" "}
                {new Date(commit.date).toLocaleDateString(dateLocale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {commit.hash.substring(0, 7)}
            </div>
          </div>
        ))}
      </div>

      {history.length >= 10 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("businessOs.cardHistory.showing", { count: 10 })}
          {githubUrl ? ` ${t("businessOs.cardHistory.showingSuffix")}` : ""}
        </p>
      )}
    </div>
  );
}
