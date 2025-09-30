"use client";

import { useTranslations } from "@acme/i18n";
import type { InteractionsProps } from "./types";
import { Input } from "../../../../atoms/shadcn";

export default function ChildrenControls({ component, handleInput }: InteractionsProps) {
  const t = useTranslations();
  const staggerChildren = component.staggerChildren;

  return (
    <Input
      type="number"
      label={t("cms.interactions.staggerChildrenMs")}
      placeholder="80"
      value={staggerChildren ?? ""}
      onChange={(e) =>
        handleInput(
          "staggerChildren",
          e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
        )
      }
    />
  );
}
