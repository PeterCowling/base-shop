"use client";
import { useTranslations } from "@acme/i18n";
import type { DatasetComponent } from "@acme/types/page/layouts/dataset";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";

import type { EditorProps } from "./EditorProps";

// i18n-exempt — admin-only builder UI; labels and placeholders are not end-user copy

type Props = EditorProps<DatasetComponent>;

export default function DatasetEditor({ component, onChange }: Props) {
  const t = useTranslations();
  const DATASET_SOURCE_ID = "dataset-source"; // i18n-exempt -- PB-2419 control id, not user-facing copy [ttl=2026-03-31]
  const DATASET_ORDER_ID = "dataset-order"; // i18n-exempt -- PB-2419 control id, not user-facing copy [ttl=2026-03-31]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={DATASET_SOURCE_ID} className="mb-1 block text-xs font-semibold text-muted-foreground">{t("cms.builder.dataset.source.label")}</label>
          <Select
            value={component.source ?? "products"}
            onValueChange={(v) => onChange({ source: v as DatasetComponent["source"] })}
          >
            <SelectTrigger id={DATASET_SOURCE_ID}>
              <SelectValue placeholder={t("cms.builder.dataset.source.placeholder") as string} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">{t("cms.builder.dataset.source.products")}</SelectItem>
              <SelectItem value="manual">{t("cms.builder.dataset.source.manual")}</SelectItem>
              <SelectItem value="blog">{t("cms.builder.dataset.source.blogSanity")}</SelectItem>
              <SelectItem value="sanity">{t("cms.builder.dataset.source.sanityCustom")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            label={t("cms.builder.dataset.limit")}
            type="number"
            value={component.limit ?? ""}
            onChange={(e) => onChange({ limit: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
      </div>
      {component.source === "products" && (
        <Input
          label={t("cms.builder.dataset.collectionId")}
          placeholder={t("cms.builder.dataset.collectionId.placeholder") as string}
          value={component.collectionId ?? ""}
          onChange={(e) => onChange({ collectionId: e.target.value })}
        />
      )}
      {component.source === "manual" && (
        <Textarea
          label={t("cms.builder.dataset.skus")}
          placeholder={t("cms.builder.dataset.skus.placeholder") as string}
          value={(() => {
            const raw = (component.skus as unknown);
            const list = Array.isArray(raw) ? raw : [];
            return list
              .map((s: unknown) => {
                if (typeof s === "string") return s;
                if (s && typeof s === "object" && "id" in s) return String((s as { id: string }).id);
                return "";
              })
              .filter(Boolean)
              .join(",");
          })()}
          onChange={(e) =>
            onChange({
              skus: e.target.value
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((id) => ({ id })),
            })
          }
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={t("cms.builder.dataset.sortBy")}
          placeholder={t("cms.builder.dataset.sortBy.placeholder") as string}
          value={component.sortBy ?? ""}
          onChange={(e) => onChange({ sortBy: e.target.value || undefined })}
        />
        <div>
          <label htmlFor={DATASET_ORDER_ID} className="mb-1 block text-xs font-semibold text-muted-foreground">{t("cms.builder.dataset.order")}</label>
          <Select value={component.sortOrder ?? "asc"} onValueChange={(v) => onChange({ sortOrder: v as DatasetComponent["sortOrder"] })}>
            <SelectTrigger id={DATASET_ORDER_ID}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{t("cms.builder.dataset.order.asc")}</SelectItem>
              <SelectItem value="desc">{t("cms.builder.dataset.order.desc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Input
        label={t("cms.builder.dataset.itemRoutePattern")}
        placeholder={t("cms.builder.dataset.itemRoutePattern.placeholder") as string}
        value={component.itemRoutePattern ?? ""}
        onChange={(e) => onChange({ itemRoutePattern: e.target.value || undefined })}
      />
    </div>
  );
}
