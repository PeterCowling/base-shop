"use client";

import { useCallback, useState } from "react";
import type { ScaffoldSpec } from "@acme/types/page/ScaffoldSpec";
import { useTranslations } from "@acme/i18n";

interface Props {
  onNext: (spec: ScaffoldSpec) => void;
}

export default function SpecForm({ onNext }: Props) {
  const t = useTranslations();
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
        {t("Layout")}
        <select value={layout} onChange={handleLayout}>
          <option value="default">{t("Default")}</option>
          <option value="sidebar">{t("Sidebar")}</option>
        </select>
      </label>
      <label className="flex flex-col">
        {t("Sections")}
        <input
          value={sections}
          onChange={handleSections}
          placeholder={String(t("intro,features"))}
        />
      </label>
      <label className="flex flex-col">
        {t("Hero")}
        <input value={hero} onChange={handleHero} placeholder={String(t("Welcome"))} />
      </label>
      <label className="flex flex-col">
        {t("Call to action")}
        <input value={cta} onChange={handleCta} placeholder={String(t("Start"))} />
      </label>
      <button type="submit">{t("Next")}</button>
    </form>
  );
}
