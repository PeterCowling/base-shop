"use client";

import { Button, Checkbox, Input } from "@ui/components/atoms/shadcn";
import { updateLateFee } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "@acme/i18n";

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

export default function LateFeesEditor({ shop, initial }: Props) {
  const t = useTranslations();
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const FIELD_INTERVAL_MINUTES = "intervalMinutes"; // i18n-exempt -- CMS-TECH-001 form field name [ttl=2026-01-01]

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: Number(value) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    if (state.enabled) {
      fd.set("enabled", "on");
    }
    fd.set("intervalMinutes", String(state.intervalMinutes));
    const result = await updateLateFee(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.lateFeeService) {
      setState(result.settings.lateFeeService);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="flex items-center gap-2">
        <Checkbox
          name="enabled"
          checked={state.enabled}
          onCheckedChange={(v: boolean) =>
            setState((s) => ({ ...s, enabled: Boolean(v) }))
          }
        />
        <span>{t("cms.lateFees.enableService")}</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>{t("cms.lateFees.intervalMinutes")}</span>
        <Input
          type="number"
          name={FIELD_INTERVAL_MINUTES}
          value={state.intervalMinutes}
          onChange={handleChange}
        />
        {errors.intervalMinutes && (
          <span className="text-sm text-danger-foreground">
            {errors.intervalMinutes.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-primary-foreground" disabled={saving} type="submit">
        {saving ? t("actions.saving") : t("actions.save")}
      </Button>
    </form>
  );
}
