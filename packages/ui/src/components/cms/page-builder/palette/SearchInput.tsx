"use client";

import type { ChangeEvent } from "react";
import { useTranslations } from "@acme/i18n";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: Props) {
  const t = useTranslations();
  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  return (
    <input
      type="text"
      value={value}
      onChange={onChangeHandler}
      placeholder={t("pb.search.components.placeholder") as string}
      aria-label={t("pb.search.components.aria") as string}
      className="rounded border p-2 text-sm"
    />
  );
}
