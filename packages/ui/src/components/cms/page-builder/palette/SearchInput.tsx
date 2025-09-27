"use client";

import type { ChangeEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: Props) {
  const onChangeHandler = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  return (
    <input
      type="text"
      value={value}
      onChange={onChangeHandler}
      // i18n-exempt: Internal builder search, not user-facing copy
      placeholder="Search components..."
      // i18n-exempt: Internal builder control label
      aria-label="Search components"
      className="rounded border p-2 text-sm"
    />
  );
}
