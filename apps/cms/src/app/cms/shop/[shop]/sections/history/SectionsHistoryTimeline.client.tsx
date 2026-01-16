// apps/cms/src/app/cms/shop/[shop]/sections/history/SectionsHistoryTimeline.client.tsx
"use client";

import { Timeline, type TimelineEvent } from "@acme/ui/operations";
import type { SectionTemplate } from "@acme/types";
import { useMemo } from "react";
import { FileEdit, FilePlus, FileX, History } from "lucide-react";
import { useTranslations } from "@i18n/Translations";

type SectionHistoryEvent = {
  type: string;
  id?: string;
  before?: SectionTemplate | null;
  after?: SectionTemplate | null;
  at?: string;
  detectedAt?: string;
};

interface SectionsHistoryTimelineProps {
  shop: string;
  items: SectionHistoryEvent[];
}

export function SectionsHistoryTimeline({ shop, items }: SectionsHistoryTimelineProps) {
  const t = useTranslations();

  // Transform section history events to timeline format
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    return items.map((event, idx) => {
      const timestamp = event.at ?? event.detectedAt;
      const sectionId = event.id ?? event.after?.id ?? event.before?.id ?? "-";

      // Determine event type and styling
      let icon = History;
      let iconColor: "blue" | "green" | "red" | "yellow" | "gray" = "gray";
      let title = String(t("cms.sections.history.type"));
      let description = String(event.type);

      switch (event.type.toLowerCase()) {
        case "created":
        case "add":
        case "added":
          icon = FilePlus;
          iconColor = "green";
          title = "Section Created";
          description = `Section ${sectionId} was created`;
          break;
        case "updated":
        case "modified":
        case "edit":
        case "edited":
          icon = FileEdit;
          iconColor = "blue";
          title = "Section Updated";
          description = `Section ${sectionId} was modified`;
          break;
        case "deleted":
        case "removed":
          icon = FileX;
          iconColor = "red";
          title = "Section Deleted";
          description = `Section ${sectionId} was removed`;
          break;
        default:
          title = String(event.type);
          description = `Section ${sectionId}`;
      }

      // Add restore button if snapshot is available
      const metadata = event.after ? (
        <form
          action={`/api/sections/${encodeURIComponent(shop)}/restore`}
          method="post"
          className="mt-2"
        >
          <input type="hidden" name="snapshot" value={JSON.stringify(event.after as SectionTemplate)} />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border/30 bg-surface-2 px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {String(t("cms.sections.history.restore"))}
          </button>
        </form>
      ) : undefined;

      return {
        id: `${idx}`,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        title,
        description,
        icon,
        iconColor,
        metadata,
      };
    });
  }, [items, shop, t]);

  if (timelineEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {String(t("cms.sections.history.empty"))}
      </p>
    );
  }

  return (
    <Timeline
      events={timelineEvents}
      showTime
      showDate
      emptyMessage={String(t("cms.sections.history.empty"))}
    />
  );
}
