// packages/ui/components/cms/ProductFilters.tsx  (unchanged except export)
"use client";
import { Input } from "../atoms/shadcn";
import { ChangeEvent } from "react";
import { Inline } from "../atoms/primitives/Inline";
import { useTranslations } from "@acme/i18n";

export const statuses = ["all", "active", "draft", "archived"] as const;

interface Props {
  search: string;
  status: string;
  onSearchChange(v: string): void;
  onStatusChange(v: string): void;
}

export default function ProductFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: Props) {
  const t = useTranslations();
  return (
    <Inline className="gap-3" wrap>
      <Input
        type="search"
        placeholder={t("filters.searchPlaceholder") as string}
        className="w-64"
        value={search}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onSearchChange(e.target.value)}
      />
      <select
        className="rounded-md border px-3 py-2 text-sm"
        value={status}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onStatusChange(e.target.value)
        }
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? (t("filters.allStatuses") as string) : (t(`status.${s}`) as string)}
          </option>
        ))}
      </select>
    </Inline>
  );
}
