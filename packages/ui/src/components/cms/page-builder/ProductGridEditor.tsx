import type { ProductGridComponent } from "@acme/types";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";

interface Props {
  component: ProductGridComponent;
  onChange: (patch: Partial<ProductGridComponent>) => void;
}

export default function ProductGridEditor({ component, onChange }: Props) {
  const { handleInput } = useComponentInputs<ProductGridComponent>(onChange);
  return (
    <>
      <div className="flex items-center gap-2">
        <Checkbox
          id="quickView"
          checked={component.quickView ?? false}
          onCheckedChange={(v) => handleInput("quickView", v ? true : undefined)}
        />
        <label htmlFor="quickView" className="text-sm">
          Enable Quick View
        </label>
      </div>
      <Select
        value={component.mode ?? "collection"}
        onValueChange={(v) => handleInput("mode", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="collection">Collection</SelectItem>
          <SelectItem value="manual">Manual SKUs</SelectItem>
        </SelectContent>
      </Select>
      {component.mode === "collection" ? (
        <Input
          label="Collection ID"
          value={component.collectionId ?? ""}
          onChange={(e) => handleInput("collectionId", e.target.value)}
        />
      ) : (
        <Textarea
          label="SKUs (comma separated)"
          value={(component.skus ?? []).join(",")}
          onChange={(e) =>
            handleInput(
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
