"use client";
import type { DatasetComponent } from "@acme/types/page/layouts/dataset";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<DatasetComponent & { children: any[] }>;

export default function DatasetEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Source</label>
          <Select
            value={component.source ?? "products"}
            onValueChange={(v) => onChange({ source: v as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="blog">Blog (Sanity)</SelectItem>
              <SelectItem value="sanity">Sanity (custom)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input
            label="Limit"
            type="number"
            value={(component.limit ?? "") as any}
            onChange={(e) => onChange({ limit: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </div>
      </div>
      {component.source === "products" && (
        <Input
          label="Collection ID"
          placeholder="collection key/handle"
          value={component.collectionId ?? ""}
          onChange={(e) => onChange({ collectionId: e.target.value })}
        />
      )}
      {component.source === "manual" && (
        <Textarea
          label="SKUs (comma separated)"
          placeholder="sku-1, sku-2, sku-3"
          value={((component.skus ?? []).map((s: any) => (typeof s === 'string' ? s : s.id))).join(",")}
          onChange={(e) =>
            onChange({
              skus: e.target.value
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((id) => ({ id } as any)),
            })
          }
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Sort by"
          placeholder="title | price | createdAt"
          value={component.sortBy ?? ""}
          onChange={(e) => onChange({ sortBy: e.target.value || undefined })}
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Order</label>
          <Select value={component.sortOrder ?? "asc"} onValueChange={(v) => onChange({ sortOrder: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">asc</SelectItem>
              <SelectItem value="desc">desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Input
        label="Item route pattern"
        placeholder="/blog/{slug}"
        value={component.itemRoutePattern ?? ""}
        onChange={(e) => onChange({ itemRoutePattern: e.target.value || undefined })}
      />
    </div>
  );
}
