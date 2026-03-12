"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Search } from "lucide-react";

import type {
  PrimeTemplate,
  PrimeTemplateCategory,
} from "@/lib/inbox/prime-templates";
import {
  allTemplates,
  formatTemplateForDraft,
  matchTemplates,
} from "@/lib/inbox/prime-templates";

interface TemplatePickerProps {
  /** Latest inbound message text for auto-suggest. Null when no inbound messages exist. */
  latestInboundText: string | null;
  /** Callback when a template is selected. Receives formatted text and template ID. */
  onSelect: (formattedText: string, templateId: string) => void;
  /** Currently active template ID (if any). */
  activeTemplateId: string | null;
}

const CATEGORY_LABELS: Record<PrimeTemplateCategory, string> = {
  booking: "Booking",
  experiences: "Activities & Experiences",
  food: "Food & Drink",
  transport: "Transport & Directions",
  bag_drop: "Bag Storage",
};

function groupByCategory(
  templates: PrimeTemplate[],
): Map<PrimeTemplateCategory, PrimeTemplate[]> {
  const groups = new Map<PrimeTemplateCategory, PrimeTemplate[]>();
  for (const template of templates) {
    const existing = groups.get(template.category);
    if (existing) {
      existing.push(template);
    } else {
      groups.set(template.category, [template]);
    }
  }
  return groups;
}

export default function TemplatePicker({
  latestInboundText,
  onSelect,
  activeTemplateId,
}: TemplatePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [locale, setLocale] = useState<"en" | "it">("en");

  // Auto-suggest based on latest inbound message
  const autoSuggestions = useMemo(() => {
    if (!latestInboundText) return [];
    return matchTemplates(latestInboundText);
  }, [latestInboundText]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return matchTemplates(searchQuery);
  }, [searchQuery]);

  // Determine which templates to show
  const displayTemplates = searchQuery.trim()
    ? searchResults
    : browsing
      ? allTemplates()
      : autoSuggestions;

  const isSearchOrBrowse = searchQuery.trim() || browsing;

  const handleSelect = useCallback(
    (template: PrimeTemplate) => {
      const formatted = formatTemplateForDraft(template, locale);
      onSelect(formatted, template.id);
    },
    [locale, onSelect],
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleToggleBrowse = useCallback(() => {
    setBrowsing((prev) => !prev);
    setSearchQuery("");
  }, []);

  const grouped = useMemo(
    () => (browsing && !searchQuery.trim() ? groupByCategory(displayTemplates) : null),
    [browsing, displayTemplates, searchQuery],
  );

  return (
    <div
      className="rounded-xl border border-border-1 bg-surface-2 p-3"
      role="region"
      aria-label="Template suggestions"
    >
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
          <FileText className="h-3.5 w-3.5" />
          Templates
        </div>
        <div className="flex items-center gap-2">
          {/* Locale toggle */}
          <div className="flex rounded-md border border-border-1" role="radiogroup" aria-label="Template language">
            <button
              type="button"
              className={`px-2 py-0.5 text-xs font-medium transition ${
                locale === "en"
                  ? "bg-primary-main text-primary-fg"
                  : "text-foreground/60 hover:text-foreground"
              } rounded-l-md`}
              onClick={() => setLocale("en")}
              role="radio"
              aria-checked={locale === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={`px-2 py-0.5 text-xs font-medium transition ${
                locale === "it"
                  ? "bg-primary-main text-primary-fg"
                  : "text-foreground/60 hover:text-foreground"
              } rounded-r-md`}
              onClick={() => setLocale("it")}
              role="radio"
              aria-checked={locale === "it"}
            >
              IT
            </button>
          </div>
          {/* Browse toggle */}
          <button
            type="button"
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
              browsing
                ? "bg-info-light text-info-main"
                : "text-foreground/60 hover:text-foreground"
            }`}
            onClick={handleToggleBrowse}
            aria-pressed={browsing}
          >
            {browsing ? "Hide all" : "Browse all"}
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim()) {
              setBrowsing(false);
            }
          }}
          className="w-full rounded-lg border border-border-1 bg-surface-2 py-1.5 pl-8 pr-3 text-xs text-foreground outline-none transition placeholder:text-foreground/40 focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
          placeholder="Search templates..."
          aria-label="Search templates"
        />
      </div>

      {/* Template list */}
      {grouped ? (
        // Browse mode: grouped by category
        <div className="space-y-1" role="list" aria-label="Templates by category">
          {Array.from(grouped.entries()).map(([category, templates]) => (
            <div key={category} role="listitem">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-surface-3"
                onClick={() => toggleCategory(category)}
                aria-expanded={expandedCategories.has(category)}
              >
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {CATEGORY_LABELS[category]}
                <span className="ml-auto text-foreground/40">
                  {templates.length}
                </span>
              </button>
              {expandedCategories.has(category) && (
                <div className="ml-4 space-y-1" role="list">
                  {templates.map((template) => (
                    <TemplateChip
                      key={template.id}
                      template={template}
                      locale={locale}
                      isActive={template.id === activeTemplateId}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : displayTemplates.length > 0 ? (
        // Flat list: suggestions or search results
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Template suggestions">
          {displayTemplates.map((template) => (
            <TemplateChip
              key={template.id}
              template={template}
              locale={locale}
              isActive={template.id === activeTemplateId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <p className="py-1 text-center text-xs text-foreground/50">
          {searchQuery.trim()
            ? "No matching templates."
            : isSearchOrBrowse
              ? "No templates available."
              : "No template suggestions for this message. Try Browse all or type your reply."}
        </p>
      )}
    </div>
  );
}

// --- TemplateChip sub-component ---

function TemplateChip({
  template,
  locale,
  isActive,
  onSelect,
}: {
  template: PrimeTemplate;
  locale: "en" | "it";
  isActive: boolean;
  onSelect: (template: PrimeTemplate) => void;
}) {
  return (
    <button
      type="button"
      role="listitem"
      className={`max-w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
        isActive
          ? "border-primary-main bg-primary-soft text-primary-main"
          : "border-border-1 bg-surface-3/50 text-foreground/80 hover:border-primary-main/40 hover:bg-surface-3"
      }`}
      onClick={() => onSelect(template)}
      aria-label={`Use ${template.id} template`}
    >
      <span className="font-medium">{CATEGORY_LABELS[template.category]}</span>
      <span className="mx-1 text-foreground/30">|</span>
      <span className="line-clamp-1">{template.answer[locale]}</span>
    </button>
  );
}
