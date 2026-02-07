"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { Button } from "@acme/design-system/primitives";

import { Inline, Stack } from "@/components/ui/flex";

import { TextInput } from "../components/FormFields";
import { RichTextEditor } from "../components/RichTextEditor";
import type { TabProps } from "../types";

type Faq = {
  q?: string;
  a?: string | string[];
};

type FaqCardProps = {
  faq: Faq;
  index: number;
  onUpdate: (updates: Partial<Faq>) => void;
  onRemove: () => void;
};

function FaqCard({ faq, index, onUpdate, onRemove }: FaqCardProps) {
  return (
    <div className="rounded-lg border border-brand-outline/30 bg-brand-surface p-4">
      <Inline className="mb-4 justify-between">
        <span className="text-xs font-semibold text-brand-text/60">FAQ #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-brand-terra hover:underline"
        >
          Remove
        </button>
      </Inline>
      <Stack className="gap-4">
        <TextInput
          label="Question"
          value={faq.q ?? ""}
          onChange={(v) => onUpdate({ q: v || undefined })}
          placeholder="What question does this answer?"
        />
        <RichTextEditor
          fieldId={`faqs.${index}.a`}
          label="Answer"
          value={faq.a}
          onChange={(next) => onUpdate({ a: next })}
          placeholder="Provide a helpful, complete answer"
          allowedFormats={["bold", "italic", "link"]}
          hint="Use blank lines to separate paragraphs"
        />
      </Stack>
    </div>
  );
}

export default function FaqsTab({ content, updateField }: TabProps) {
  const faqs = (content.faqs ?? []) as Faq[];

  const addFaq = () => {
    updateField("faqs", [...faqs, { q: "", a: [] }]);
  };

  const updateFaq = (index: number, updates: Partial<Faq>) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], ...updates };
    updateField("faqs", updated);
  };

  const removeFaq = (index: number) => {
    updateField(
      "faqs",
      faqs.filter((_, i) => i !== index),
    );
  };

  return (
    <Stack className="gap-4">
      <p className="text-xs text-brand-text/60">
        FAQs appear on the guide page and generate FAQPage structured data for search engines.
      </p>

      {faqs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-brand-outline/30 p-8 text-center">
          <p className="text-sm text-brand-text/60">No FAQs yet</p>
          <p className="mt-1 text-xs text-brand-text/40">
            Add frequently asked questions to help visitors and improve SEO
          </p>
        </div>
      ) : (
        faqs.map((faq, index) => (
          <FaqCard
            key={`faq-${index}`}
            faq={faq}
            index={index}
            onUpdate={(updates) => updateFaq(index, updates)}
            onRemove={() => removeFaq(index)}
          />
        ))
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addFaq}
        className="h-10 rounded-lg border-brand-outline/40 text-sm text-brand-text"
      >
        + Add FAQ
      </Button>
    </Stack>
  );
}
