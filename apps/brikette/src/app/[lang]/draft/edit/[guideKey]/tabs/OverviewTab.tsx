"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { Stack } from "@/components/ui/flex";

import FieldGroup from "../components/FieldGroup";
import { TextArea, TextInput } from "../components/FormFields";
import { RichTextEditor } from "../components/RichTextEditor";
import type { TabProps } from "../types";

export default function OverviewTab({ content, updateField }: TabProps) {
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
        <RichTextEditor
          fieldId="intro"
          label="Intro paragraphs"
          value={content.intro}
          onChange={(next) => updateField("intro", next)}
          placeholder="Write the introduction to your guide..."
          allowedFormats={["bold", "italic", "link"]}
          hint="Separate paragraphs with blank lines. This appears at the top of the guide."
        />
      </FieldGroup>
    </Stack>
  );
}
