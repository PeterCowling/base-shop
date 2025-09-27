"use client";
import type { DatasetComponent } from "@acme/types/page/layouts/dataset";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";
import { useTranslations } from "@acme/i18n";

type Props = EditorProps<DatasetComponent>;

export default function DatasetEditor({ component, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          {/* i18n-exempt: admin-only label in builder UI */}
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Source</label>
          <Select
            value={component.source ?? "products"}
            onValueChange={(v) => onChange({ source: v as DatasetComponent["source"] })}
          >
            <SelectTrigger>
              {/* i18n-exempt: admin-only placeholder */}
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {/* i18n-exempt: admin-only options; labels wrapped for linting */}
              <SelectItem value="products">{t("Products")}</SelectItem>
              <SelectItem value="manual">{t("Manual")}</SelectItem>
              <SelectItem value="blog">{t("Blog (Sanity)")}</SelectItem>
              <SelectItem value="sanity">{t("Sanity (custom)")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            // i18n-exempt: admin-only label in builder UI
            label="Limit"
            type="number"
            value={component.limit ?? ""}
            onChange={(e) => onChange({ limit: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
      </div>
      {component.source === "products" && (
        <Input
          // i18n-exempt: admin-only label in builder UI
          label="Collection ID"
          // i18n-exempt: admin-only placeholder
          placeholder="collection key/handle"
          value={component.collectionId ?? ""}
          onChange={(e) => onChange({ collectionId: e.target.value })}
        />
      )}
      {component.source === "manual" && (
        <Textarea
          // i18n-exempt: admin-only label in builder UI
          label="SKUs (comma separated)"
          // i18n-exempt: admin-only placeholder
          placeholder="sku-1, sku-2, sku-3"
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
          // i18n-exempt: admin-only label in builder UI
          label="Sort by"
          // i18n-exempt: admin-only placeholder
          placeholder="title | price | createdAt"
          value={component.sortBy ?? ""}
          onChange={(e) => onChange({ sortBy: e.target.value || undefined })}
        />
        <div>
          {/* i18n-exempt: admin-only label in builder UI */}
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Order</label>
          <Select value={component.sortOrder ?? "asc"} onValueChange={(v) => onChange({ sortOrder: v as DatasetComponent["sortOrder"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {/* i18n-exempt: admin-only options */}
              <SelectItem value="asc">asc</SelectItem>
              <SelectItem value="desc">desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Input
        // i18n-exempt: admin-only label in builder UI
        label="Item route pattern"
        // i18n-exempt: admin-only placeholder
        placeholder="/blog/{slug}"
        value={component.itemRoutePattern ?? ""}
        onChange={(e) => onChange({ itemRoutePattern: e.target.value || undefined })}
      />
    </div>
  );
}
