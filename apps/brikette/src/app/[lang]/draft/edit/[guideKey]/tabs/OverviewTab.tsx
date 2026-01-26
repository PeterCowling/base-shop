"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { Stack } from "@/components/ui/flex";

import FieldGroup from "../components/FieldGroup";
import { TextArea, TextInput } from "../components/FormFields";
import type { TabProps } from "../types";

/**
 * Normalize intro to string for editing.
 * Intro can be string, string[], or Record<string, unknown>.
 */
function normalizeIntroToString(intro: unknown): string {
  if (typeof intro === "string") return intro;
  if (Array.isArray(intro)) return intro.filter((s) => typeof s === "string").join("\n\n");
  return "";
}

/**
 * Parse edited intro string back to array format.
 */
function parseIntroFromString(value: string): string[] {
  return value
    .split("\n\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function OverviewTab({ content, updateField }: TabProps) {
  const introText = normalizeIntroToString(content.intro);

  return (
    <Stack className="gap-6">
      <FieldGroup label="SEO" description="Search engine optimization fields">
        <TextInput
          label="Meta title"
          value={content.seo?.title ?? ""}
          onChange={(v) => updateField("seo.title", v || undefined)}
          placeholder="Page title for search results"
          maxLength={70}
          showCount
          hint="Ideal: 50-60 characters. Appears in browser tabs and search results."
        />
        <TextArea
          label="Meta description"
          value={content.seo?.description ?? ""}
          onChange={(v) => updateField("seo.description", v || undefined)}
          placeholder="Brief description for search results"
          maxLength={170}
          showCount
          rows={3}
          hint="Ideal: 150-160 characters. Appears in search result snippets."
        />
      </FieldGroup>

      <FieldGroup label="Navigation" description="How this guide appears in navigation">
        <TextInput
          label="Link label"
          value={content.linkLabel ?? ""}
          onChange={(v) => updateField("linkLabel", v || undefined)}
          placeholder="Text shown in navigation links"
          hint="Short label used in menus and related guides lists."
        />
      </FieldGroup>

      <FieldGroup label="Introduction" description="Opening content for the guide">
        <TextArea
          label="Intro paragraphs"
          value={introText}
          onChange={(v) => updateField("intro", parseIntroFromString(v))}
          placeholder="Write the introduction to your guide..."
          rows={6}
          hint="Separate paragraphs with blank lines. This appears at the top of the guide."
        />
      </FieldGroup>
    </Stack>
  );
}
