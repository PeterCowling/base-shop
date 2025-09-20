"use client";

import type { PageComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";

type RepeaterComponent = PageComponent & {
  limit?: number;
  filter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
};

interface Props {
  component: RepeaterComponent;
  onChange: (patch: Partial<RepeaterComponent>) => void;
}

export default function RepeaterEditor({ component, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <Input
          label="Limit"
          type="number"
          value={(component.limit ?? "") as any}
          onChange={(e) => onChange({ limit: e.target.value === "" ? undefined : Number(e.target.value) })}
        />
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
        label="Filter"
        placeholder="status=published or price>10"
        value={component.filter ?? ""}
        onChange={(e) => onChange({ filter: e.target.value || undefined })}
      />
      <div className="grid grid-cols-4 gap-2">
        <Input label="Cols" type="number" value={(component.columns ?? "") as any} onChange={(e) => onChange({ columns: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label="Cols (Desktop)" type="number" value={(component.columnsDesktop ?? "") as any} onChange={(e) => onChange({ columnsDesktop: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label="Cols (Tablet)" type="number" value={(component.columnsTablet ?? "") as any} onChange={(e) => onChange({ columnsTablet: e.target.value === "" ? undefined : Number(e.target.value) })} />
        <Input label="Cols (Mobile)" type="number" value={(component.columnsMobile ?? "") as any} onChange={(e) => onChange({ columnsMobile: e.target.value === "" ? undefined : Number(e.target.value) })} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Input label="Gap" value={component.gap ?? ""} onChange={(e) => onChange({ gap: e.target.value || undefined })} />
        <Input label="Gap (Desktop)" value={component.gapDesktop ?? ""} onChange={(e) => onChange({ gapDesktop: e.target.value || undefined })} />
        <Input label="Gap (Tablet)" value={component.gapTablet ?? ""} onChange={(e) => onChange({ gapTablet: e.target.value || undefined })} />
        <Input label="Gap (Mobile)" value={component.gapMobile ?? ""} onChange={(e) => onChange({ gapMobile: e.target.value || undefined })} />
      </div>
    </div>
  );
}

