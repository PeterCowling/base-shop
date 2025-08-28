"use client";

import { useCallback, useState } from "react";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";

interface Props {
  onNext: (spec: ScaffoldSpec) => void;
  t: (key: string) => string;
}

export default function SpecForm({ onNext, t }: Props) {
  const [layout, setLayout] = useState<"default" | "sidebar">("default");
  const [sections, setSections] = useState("");
  const [hero, setHero] = useState("");
  const [cta, setCta] = useState("");

  const handleLayout = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLayout(e.target.value as "default" | "sidebar");
    },
    []
  );
  const handleSections = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSections(e.target.value);
    },
    []
  );
  const handleHero = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setHero(e.target.value);
    },
    []
  );
  const handleCta = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCta(e.target.value);
    },
    []
  );

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const spec: ScaffoldSpec = {
        layout,
        sections: sections
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hero,
        cta,
      };
      onNext(spec);
    },
    [layout, sections, hero, cta, onNext]
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col">
        {t("wizard.spec.layout")}
        <select value={layout} onChange={handleLayout}>
          <option value="default">{t("wizard.spec.layout.default")}</option>
          <option value="sidebar">{t("wizard.spec.layout.sidebar")}</option>
        </select>
      </label>
      <label className="flex flex-col">
        {t("wizard.spec.sections")}
        <input
          value={sections}
          onChange={handleSections}
          placeholder={t("wizard.spec.sections.placeholder")}
        />
      </label>
      <label className="flex flex-col">
        {t("wizard.spec.hero")}
        <input value={hero} onChange={handleHero} placeholder={t("wizard.spec.hero.placeholder")}
        />
      </label>
      <label className="flex flex-col">
        {t("wizard.spec.cta")}
        <input value={cta} onChange={handleCta} placeholder={t("wizard.spec.cta.placeholder")}
        />
      </label>
      <button type="submit">{t("wizard.next")}</button>
    </form>
  );
}
