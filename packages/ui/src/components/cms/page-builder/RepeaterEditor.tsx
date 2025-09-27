"use client";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";
import type { RepeaterComponent } from "@acme/types/page/layouts/repeater";

type Props = EditorProps<RepeaterComponent>;

export default function RepeaterEditor({ component, onChange }: Props) {
  // i18n-exempt — internal editor labels
  /* i18n-exempt */
  const t = (s: string) => s;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Input
          label={t("Limit")}
          type="number"
          value={component.limit ?? ""}
          onChange={(e) => onChange({ limit: e.target.value === "" ? undefined : Number(e.target.value) })}
        />
        <Input
          label={t("Sort by")}
          placeholder={t("title | price | createdAt")}
          value={component.sortBy ?? ""}
          onChange={(e) => onChange({ sortBy: e.target.value || undefined })}
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">{t("Order")}</label>
          <Select value={component.sortOrder ?? "asc"} onValueChange={(v: "asc" | "desc") => onChange({ sortOrder: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t("asc")}</SelectItem>
              <SelectItem value="desc">{t("desc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Input
        label={t("Filter")}
        placeholder={t("status=published or price>10")}
        value={component.filter ?? ""}
        onChange={(e) => onChange({ filter: e.target.value || undefined })}
      />
      <div className="grid grid-cols-4 gap-2">
        <Input label={t("Cols")} type="number" value={component.columns ?? ""} onChange={(e) => onChange({ columns: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label={t("Cols (Desktop)")} type="number" value={component.columnsDesktop ?? ""} onChange={(e) => onChange({ columnsDesktop: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label={t("Cols (Tablet)")} type="number" value={component.columnsTablet ?? ""} onChange={(e) => onChange({ columnsTablet: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label={t("Cols (Mobile)")} type="number" value={component.columnsMobile ?? ""} onChange={(e) => onChange({ columnsMobile: e.target.value === "" ? undefined : Number(e.target.value) })} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label={t("Gap")} value={component.gap ?? ""} onChange={(e) => onChange({ gap: e.target.value || undefined })} />
        <Input label={t("Gap (Desktop)")} value={component.gapDesktop ?? ""} onChange={(e) => onChange({ gapDesktop: e.target.value || undefined })} />
        <Input label={t("Gap (Tablet)")} value={component.gapTablet ?? ""} onChange={(e) => onChange({ gapTablet: e.target.value || undefined })} />
        <Input label={t("Gap (Mobile)")} value={component.gapMobile ?? ""} onChange={(e) => onChange({ gapMobile: e.target.value || undefined })} />
      </div>
    </div>
  );
}
