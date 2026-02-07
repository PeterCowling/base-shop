"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { useCallback, useState } from "react";

import { Button } from "@acme/design-system/primitives";

import { Inline, Stack } from "@/components/ui/flex";
import type { GuideContentInput } from "@/routes/guides/content-schema";
import { guideContentSchema } from "@/routes/guides/content-schema";

type RawJsonTabProps = {
  content: GuideContentInput;
  setContent: (content: GuideContentInput) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const formatJson = (value: unknown): string => JSON.stringify(value ?? {}, null, 2);

export default function RawJsonTab({ content, setContent, onDirtyChange }: RawJsonTabProps) {
  const [draft, setDraft] = useState<string>(formatJson(content));
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[] | null>(null);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    setError(null);
    setIssues(null);
  };

  const handleFormat = useCallback(() => {
    setError(null);
    setIssues(null);
    try {
      const parsed = JSON.parse(draft);
      setDraft(formatJson(parsed));
    } catch {
      setError("Invalid JSON: fix syntax errors before formatting.");
    }
  }, [draft]);

  const handleApply = useCallback(() => {
    setError(null);
    setIssues(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("Invalid JSON: fix syntax errors before applying.");
      return;
    }

    const validation = guideContentSchema.safeParse(parsed);
    if (!validation.success) {
      setIssues(
        validation.error.issues.map(
          (issue) => `${issue.path.join(".") || "content"}: ${issue.message}`,
        ),
      );
      return;
    }

    setContent(validation.data);
    onDirtyChange?.(true);
    setDraft(formatJson(validation.data));
  }, [draft, setContent, onDirtyChange]);

  const handleReset = useCallback(() => {
    setDraft(formatJson(content));
    setError(null);
    setIssues(null);
  }, [content]);

  return (
    <Stack className="gap-4">
      <p className="text-xs text-brand-text/60">
        Edit raw JSON directly. Changes must be applied before switching tabs or saving.
      </p>

      <Inline className="flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleApply}
          className="h-9 rounded-lg bg-brand-primary px-4 text-xs font-semibold text-white"
        >
          Apply to form
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleFormat}
          className="h-9 rounded-lg border-brand-outline/40 px-4 text-xs text-brand-text"
        >
          Format JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="h-9 rounded-lg border-brand-outline/40 px-4 text-xs text-brand-text"
        >
          Reset to form state
        </Button>
      </Inline>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {issues && issues.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <p className="font-semibold">Validation issues</p>
          <ul className="mt-2 list-disc space-y-1 ps-4">
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        value={draft}
        onChange={(e) => handleDraftChange(e.target.value)}
        rows={26}
        className="w-full rounded-md border border-brand-outline/40 bg-brand-bg px-3 py-2 font-mono text-xs text-brand-heading focus:border-brand-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary/50"
      />
    </Stack>
  );
}
