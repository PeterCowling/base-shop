import TableOfContents from "@/components/guides/TableOfContents";

import type { TocItem } from "../types";
import { logStructuredToc } from "../utils/logging";

interface StructuredTocProps {
  items: TocItem[];
  title?: string;
  sectionsPresent?: boolean;
}

export default function StructuredToc({ items, title, sectionsPresent }: StructuredTocProps): JSX.Element | null {
  if (!Array.isArray(items) || items.length === 0) return null;

  // Avoid injecting duplicate headings in tests/dev; rely on actual sections
  // to render their own headings. Screen-reader only headings here can cause
  // duplicate role=heading matches in tests.
  const showDevHeadings = false;
  // Suppress the visual ToC when it would only contain a single FAQs link and
  // no sections are present. This matches UX expectations and test assertions
  // for guides where content is FAQ-only (e.g., Interrail rail pass page).
  const onlyFaqs = items.length === 1 && typeof items[0]?.href === 'string' && items[0]!.href.trim() === '#faqs';
  const shouldRenderNav = !(onlyFaqs && !sectionsPresent);
  logStructuredToc('[StructuredToc]', { count: items.length, title: title ?? '', sectionsPresent, onlyFaqs, shouldRenderNav });

  // Sanitize any raw-key FAQ labels that slipped through normalization.
  const displayItems = items.map((it) => {
    if (it?.href === '#faqs') {
      const raw = typeof it?.label === 'string' ? it.label.trim() : '';
      if (/\.faqsTitle$/i.test(raw)) {
        return { ...it, label: 'FAQs' };
      }
    }
    return it;
  });

  return (
    <>
      {shouldRenderNav
        ? (typeof title === "string" && title.length > 0
            ? <TableOfContents items={displayItems} title={title} />
            : <TableOfContents items={displayItems} />)
        : null}
      {showDevHeadings ? (
        <div className="space-y-0">
          {items.map((it, idx) => (
            <h2 key={`${it.href}-${idx}`} className="sr-only">
              {it.label}
            </h2>
          ))}
        </div>
      ) : null}
    </>
  );
}
