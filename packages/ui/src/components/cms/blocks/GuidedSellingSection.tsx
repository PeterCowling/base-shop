"use client";

import * as React from "react";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";
import { ProductCard } from "../../organisms/ProductCard";
import { useTranslations } from "@acme/i18n";
import { Stack } from "../../atoms/primitives/Stack";
import { Inline } from "../../atoms/primitives/Inline";
import { Grid as DSGrid } from "../../atoms/primitives/Grid";

type Question = {
  id: string;
  label: string;
  type: "choice";
  options: Array<{ value: string; label: string }>;
};

export interface GuidedSellingSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  questions?: Question[];
  outputMode?: "inline" | "link";
  collectionBasePath?: string;
}

export default function GuidedSellingSection({ title, questions = defaultQuestions, outputMode = "inline", collectionBasePath = "/collections", className, ...rest }: GuidedSellingSectionProps) {
  const t = useTranslations();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const q = questions[step];

  const update = (qid: string, v: string) => setAnswers((prev) => ({ ...prev, [qid]: v }));
  const next = () => setStep((s) => Math.min(questions.length, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const results = React.useMemo(() => filterProducts(PRODUCTS as SKU[], answers), [answers]);

  const done = step >= questions.length;
  const link = `${collectionBasePath}/guided?${new URLSearchParams(answers).toString()}`;

  return (
    <section className={className} {...rest}>
      <Stack className="mx-auto w-full" gap={6}>
        <h2 className="text-2xl font-semibold">{title ?? t("guided.title")}</h2>
        {!done ? (
          <Stack gap={4}>
            <div>
              <div className="mb-2 font-medium">{t(q.label)}</div>
              <Inline wrap gap={2}>
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={[
                      // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                      "rounded border px-3 inline-flex items-center min-h-10 min-w-10",
                      // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                      answers[q.id] === opt.value ? "bg-foreground text-foreground" : "bg-card",
                    ].join(" ")}
                    onClick={() => update(q.id, opt.value)}
                  >
                    {t(opt.label)}
                  </button>
                ))}
              </Inline>
            </div>
            <div
              // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              className="flex items-center justify-between"
            >
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="rounded border px-3 inline-flex items-center min-h-10 min-w-10 disabled:opacity-50"
              >
                {t("guided.back")}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!answers[q.id]}
                className="rounded border px-3 inline-flex items-center min-h-10 min-w-10 disabled:opacity-50"
              >
                {t("guided.next")}
              </button>
            </div>
          </Stack>
        ) : (
          <Stack gap={4}>
            {outputMode === "link" ? (
              <a
                href={link}
                // i18n-exempt — CSS utility class names
                className="inline-flex items-center rounded bg-foreground px-4 min-h-10 min-w-10 text-foreground"
              >
                {t("guided.viewResults")}
              </a>
            ) : (
              <DSGrid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </DSGrid>
            )}
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setAnswers({});
              }}
              className="rounded border px-3 inline-flex items-center min-h-10 min-w-10"
            >
              {t("guided.startOver")}
            </button>
          </Stack>
        )}
      </Stack>
    </section>
  );
}

// i18n-exempt — default question keys are resolved via t() at render
const defaultQuestions: Question[] = [
  {
    id: "intent",
    label: "guided.intent.label",
    type: "choice",
    options: [
      { value: "buy", label: "guided.intent.buy" },
      { value: "rent", label: "guided.intent.rent" },
    ],
  },
  {
    id: "color",
    label: "guided.color.label",
    type: "choice",
    options: [
      { value: "green", label: "guided.color.green" },
      { value: "sand", label: "guided.color.sand" },
      { value: "black", label: "guided.color.black" },
    ],
  },
];

function filterProducts(all: SKU[], a: Record<string, string>): SKU[] {
  return all.filter((p) => {
    const intentOk = a.intent === "rent" ? p.forRental : p.forSale;
    const colorOk = a.color ? String(p.id ?? "").includes(a.color) : true;
    return intentOk && colorOk;
  });
}
