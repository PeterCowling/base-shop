"use client";
import React, { useEffect, useMemo, useState } from "react";

import { baseTokens, loadThemeTokens, type TokenMap } from "./tokenUtils";

interface WizardProps {
  themes: string[];
  templates: string[]; // ignored; exists for compatibility with tests
}

const LOCALES = ["en", "de"] as const;

const stepOrder = [
  "shop-details",
  "theme",
  "summary",
  "import-data",
] as const;

type StepId = (typeof stepOrder)[number];

export default function Wizard({ themes }: WizardProps): React.JSX.Element {
  const [shopId, setShopId] = useState("");
  const [theme, setTheme] = useState(themes[0]);
  const [pageTitle, setPageTitle] = useState<Record<string, string>>({
    en: "",
    de: "",
  });
  const [tokens, setTokens] = useState<TokenMap>(baseTokens);
  const [stepIdx, setStepIdx] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const step: StepId = stepOrder[stepIdx];

  // --------------------------------------------------------------
  // Progress helpers
  // --------------------------------------------------------------
  const persist = (data: Record<string, unknown>) =>
    fetch("/cms/api/wizard-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

  const markComplete = (stepId: string, completed: boolean) =>
    fetch("/cms/api/wizard-progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, completed: completed ? "complete" : "pending" }),
    });

  // --------------------------------------------------------------
  // Load progress on mount
  // --------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/cms/api/wizard-progress");
        const json = res.ok ? await res.json() : null;
        if (cancelled || !json) return;
        if (json.state?.shopId) setShopId(json.state.shopId);
        if (json.state?.theme) setTheme(json.state.theme);
        if (json.state?.pageTitle) setPageTitle(json.state.pageTitle);

        // Determine starting step by counting completed steps
        const completed = json.completed || {};
        const idx = stepOrder.findIndex((s) => completed[s] !== "complete");
        setStepIdx(idx === -1 ? stepOrder.length - 1 : idx);
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load theme tokens whenever theme changes
  useEffect(() => {
    let cancelled = false;
    loadThemeTokens(theme)
      .then((t) => {
        if (!cancelled) setTokens(t);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [theme]);

  const style = useMemo<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    Object.entries(tokens).forEach(([k, v]) => {
      s[k] = v;
    });
    return s;
  }, [tokens]);

  // --------------------------------------------------------------
  // Step components
  // --------------------------------------------------------------
  const ShopDetailsStep = () => (
    <fieldset>
      <h2>Shop Details</h2>
      <label className="flex flex-col gap-1">
        <span>Shop ID</span>
        <input
          placeholder="my-shop"
          value={shopId}
          onChange={(e) => {
            setShopId(e.target.value);
            persist({ shopId: e.target.value });
          }}
        />
      </label>
      <div className="flex justify-end">
        <button type="button" onClick={() => setStepIdx(1)}>
          Next
        </button>
      </div>
    </fieldset>
  );

  const ThemeStep = () => (
    <fieldset>
      <h2>Select Theme</h2>
      <label className="flex flex-col gap-1">
        <span>Theme</span>
        <select
          value={theme}
          onChange={(e) => {
            setTheme(e.target.value);
            persist({ theme: e.target.value });
          }}
        >
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="flex justify-end">
        <button type="button" onClick={() => setStepIdx(2)}>
          Next
        </button>
      </div>
    </fieldset>
  );

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
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={async () => {
            setMessage(null);
            try {
              const res = await fetch("/cms/api/configurator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: shopId }),
              });
              if (res.ok) setMessage("Shop created successfully");
            } catch {
              /* ignore */
            }
          }}
        >
          Create Shop
        </button>
        <button
          type="button"
          onClick={() => {
            markComplete("summary", true);
            setStepIdx(3);
          }}
        >
          Next
        </button>
      </div>
      {message && <p>{message}</p>}
    </fieldset>
  );

  const ImportDataStep = () => (
    <fieldset>
      <h2>Import Data</h2>
      <div className="flex justify-start">
        <button type="button" onClick={() => setStepIdx(2)}>
          Back
        </button>
      </div>
    </fieldset>
  );

  const currentStep = {
    "shop-details": <ShopDetailsStep />,
    theme: <ThemeStep />,
    summary: <SummaryStep />,
    "import-data": <ImportDataStep />,
  }[step];

  return <div style={style}>{currentStep}</div>;
}

