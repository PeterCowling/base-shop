// apps/cms/src/app/cms/shop/[shop]/settings/seo/VersionTimeline.tsx

"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms-shim";
import type { SettingsDiffEntry } from "@platform-core/repositories/shops";
import { diffHistory } from "@platform-core/repositories/shops";
import { useEffect, useState } from "react";

interface VersionTimelineProps {
  /** Shop identifier */
  shop: string;
  /** Trigger element for opening the timeline drawer */
  trigger: React.ReactNode;
}

/**
 * Displays a drawer listing past settings changes.
 * TODO: render diff using diff2html and implement revert logic
 * once shops-repo-helpers package is available.
 */
export default function VersionTimeline({
  shop,
  trigger,
}: VersionTimelineProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SettingsDiffEntry[]>([]);

  useEffect(() => {
    if (open) {
      diffHistory(shop)
        .then(setHistory)
        .catch(() => setHistory([]));
    }
  }, [open, shop]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-background fixed top-0 right-0 h-full w-96 max-w-full translate-x-full overflow-y-auto border-l p-6 shadow-lg transition-transform data-[state=open]:translate-x-0">
        <DialogTitle className="mb-4">Revision History</DialogTitle>
        <div className="space-y-4 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No history available.</p>
          ) : (
            <ul className="space-y-4">
              {history.map((entry) => (
                <li key={entry.timestamp} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-mono text-xs">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <Button variant="outline" size="sm" disabled>
                      Revert
                    </Button>
                  </div>
                  <pre className="bg-muted overflow-auto rounded p-2 text-xs">
                    {JSON.stringify(entry.diff, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
