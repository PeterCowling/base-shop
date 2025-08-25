import React, { useEffect, useState } from "react";

interface WizardProps {
  themes: string[];
  templates: string[];
}

const LOCALES = ["en", "de"] as const;

export default function Wizard(_props: WizardProps): React.JSX.Element {
  const [pageTitle, setPageTitle] = useState<Record<string, string>>({
    en: "",
    de: "",
  });
  const [step, setStep] = useState<"summary" | "import-data">("summary");

  // Load progress on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        if (json.state?.pageTitle) {
          setPageTitle(json.state.pageTitle);
        }
        if (json.completed?.summary === "complete") {
          setStep("import-data");
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (data: any) =>
    fetch("/cms/api/wizard-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

  const markComplete = (stepId: string, completed: boolean) =>
    fetch("/cms/api/wizard-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, completed }),
    });

  const SummaryStep = () => (
    <fieldset>
      <h2>Summary</h2>
      {LOCALES.map((l) => (
        <label key={l} className="flex flex-col gap-1">
          <span>Home page title ({l})</span>
          <input
            value={pageTitle[l]}
            onChange={(e) => {
              const next = { ...pageTitle, [l]: e.target.value };
              setPageTitle(next);
              persist({ pageTitle: next });
            }}
          />
        </label>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            markComplete("summary", true);
            setStep("import-data");
          }}
        >
          Next
        </button>
      </div>
    </fieldset>
  );

  const ImportDataStep = () => (
    <fieldset>
      <h2>Import Data</h2>
      <div className="flex justify-start">
        <button type="button" onClick={() => setStep("summary")}>Back</button>
      </div>
    </fieldset>
  );

  return step === "summary" ? <SummaryStep /> : <ImportDataStep />;
}

