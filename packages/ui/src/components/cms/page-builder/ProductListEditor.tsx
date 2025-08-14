import type { PageComponent } from "@acme/types";
import {
  Checkbox,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ProductListEditor({ component, onChange }: Props) {
  const handle = (field: string, value: any) =>
    onChange({ [field]: value } as Partial<PageComponent>);
  return (
    <>
      <div className="flex items-center gap-2">
        <Checkbox
          id="quickView"
          checked={(component as any).quickView ?? false}
          onCheckedChange={(v) => handle("quickView", v ? true : undefined)}
        />
        <label htmlFor="quickView" className="text-sm">
          Enable Quick View
        </label>
      </div>
      <Select
        value={(component as any).mode ?? "collection"}
        onValueChange={(v) => handle("mode", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="collection">Collection</SelectItem>
          <SelectItem value="manual">Manual SKUs</SelectItem>
        </SelectContent>
      </Select>
      {(component as any).mode === "collection" ? (
        <Input
          label="Collection ID"
          value={(component as any).collectionId ?? ""}
          onChange={(e) => handle("collectionId", e.target.value)}
        />
      ) : (
        <Textarea
          label="SKUs (comma separated)"
          value={((component as any).skus ?? []).join(",")}
          onChange={(e) =>
            handle(
              "skus",
              e.target.value
                .split(/[\s,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      )}
    </>
  );
}

