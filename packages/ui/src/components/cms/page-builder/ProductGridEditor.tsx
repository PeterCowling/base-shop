import type { ProductGridComponent } from "@acme/types";
import { Checkbox, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "../../atoms/shadcn";
import useComponentInputs from "./useComponentInputs";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<ProductGridComponent>;

export default function ProductGridEditor({ component, onChange }: Props) {
  // i18n-exempt — internal editor labels
  /* i18n-exempt */
  const t = (s: string) => s;
  const { handleInput } = useComponentInputs<ProductGridComponent>(onChange);
  return (
    <>
      <div className="flex items-center gap-2">
        <Checkbox
          id="quickView"
          checked={component.quickView ?? false}
          onCheckedChange={(v) => handleInput("quickView", v ? true : undefined)}
        />
        <label htmlFor="quickView" className="text-sm">{t("Enable Quick View")}</label>
      </div>
      <Select
        value={component.mode ?? "collection"}
        onValueChange={(v: "manual" | "collection") =>
          handleInput("mode", v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder={t("Source")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="collection">{t("Collection")}</SelectItem>
          <SelectItem value="manual">{t("Manual SKUs")}</SelectItem>
        </SelectContent>
      </Select>
      {component.mode === "collection" ? (
        <Input
          label={t("Collection ID")}
          value={component.collectionId ?? ""}
          onChange={(e) => handleInput("collectionId", e.target.value)}
        />
      ) : (
        <Textarea
          label={t("SKUs (comma separated)")}
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
