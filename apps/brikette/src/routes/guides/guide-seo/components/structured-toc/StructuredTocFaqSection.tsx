import type { Translator } from "../../types";
import { type resolveFaqTitle } from "../../utils/toc";

export function FaqSectionBlock({
  guideKey,
  tGuides,
  faqTitleResolved,
}: {
  guideKey: string;
  tGuides: Translator;
  faqTitleResolved: ReturnType<typeof resolveFaqTitle>;
}) {
  try {
    const rawA = tGuides(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
    const rawB = tGuides(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;

    const flatten = (input: unknown): Array<Record<string, unknown>> => {
      const out: Array<Record<string, unknown>> = [];
      const walk = (val: unknown) => {
        if (Array.isArray(val)) {
          for (const v of val) walk(v);
        } else if (val && typeof val === "object") {
          out.push(val as Record<string, unknown>);
        }
      };
      walk(input);
      return out;
    };

    const merged = [...flatten(rawA), ...flatten(rawB)];
    const itemsRaw = merged
      .map((f) => {
        const questionSource =
          typeof f["q"] === "string"
            ? f["q"]
            : typeof f["question"] === "string"
              ? f["question"]
              : "";
        const q = questionSource.trim();
        const answerSource = f["a"] ?? f["answer"];
        const answers = Array.isArray(answerSource)
          ? answerSource
              .map((value) => (typeof value === "string" ? value.trim() : String(value)))
              .filter((value) => value.length > 0)
          : typeof answerSource === "string"
            ? [answerSource.trim()].filter((value) => value.length > 0)
            : [];
        return q && answers.length > 0 ? { q, a: answers } : null;
      })
      .filter((entry): entry is { q: string; a: string[] } => entry != null);

    // Deduplicate by q + answers signature
    const seen = new Set<string>();
    const items = itemsRaw.filter((it) => {
      const key = `${it.q}::${it.a.join("\u0001")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (items.length === 0) return null;

    const faqsHeading = (() => {
      if (faqTitleResolved.suppressed && !faqTitleResolved.title) return "";
      const resolved =
        typeof faqTitleResolved.title === "string" ? faqTitleResolved.title.trim() : "";
      return resolved;
    })();

    return (
      <section id="faqs" className="space-y-3">
        {faqsHeading.trim().length > 0 ? (
          <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
            {faqsHeading}
          </h2>
        ) : null}
        {items.map((f, idx) => (
          <details key={`faq-${idx}`}>
            <summary role="button" className="font-medium">
              {f.q}
            </summary>
            {f.a.map((ans, i) => (
              <p key={`faq-${idx}-${i}`}>{ans}</p>
            ))}
          </details>
        ))}
      </section>
    );
  } catch {
    return null;
  }
}
