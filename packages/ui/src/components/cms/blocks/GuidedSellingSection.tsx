"use client";

import * as React from "react";
import { PRODUCTS } from "@acme/platform-core/products/index";
import type { SKU } from "@acme/types";
import { ProductCard } from "../../organisms/ProductCard";

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

export default function GuidedSellingSection({ title = "Find your match", questions = defaultQuestions, outputMode = "inline", collectionBasePath = "/collections", className, ...rest }: GuidedSellingSectionProps) {
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
      <div className="mx-auto max-w-3xl space-y-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {!done ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 font-medium">{q.label}</div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={["rounded border px-3 py-1", answers[q.id] === opt.value ? "bg-black text-white" : "bg-white"].join(" ")}
                    onClick={() => update(q.id, opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={back} disabled={step === 0} className="rounded border px-3 py-1 disabled:opacity-50">Back</button>
              <button type="button" onClick={next} disabled={!answers[q.id]} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {outputMode === "link" ? (
              <a href={link} className="inline-block rounded bg-black px-4 py-2 text-white">View results</a>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
            <button type="button" onClick={() => { setStep(0); setAnswers({}); }} className="rounded border px-3 py-1">Start over</button>
          </div>
        )}
      </div>
    </section>
  );
}

const defaultQuestions: Question[] = [
  {
    id: "intent",
    label: "Are you looking to buy or rent?",
    type: "choice",
    options: [
      { value: "buy", label: "Buy" },
      { value: "rent", label: "Rent" },
    ],
  },
  {
    id: "color",
    label: "Pick a color family",
    type: "choice",
    options: [
      { value: "green", label: "Green" },
      { value: "sand", label: "Sand" },
      { value: "black", label: "Black" },
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
