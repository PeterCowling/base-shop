import { Button, Input } from "@acme/design-system/shadcn";
import type { LookbookComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import ImagePicker from "./ImagePicker";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<LookbookComponent>;

export default function LookbookEditor({ component, onChange }: Props) {
  const handleInput = (field: keyof LookbookComponent & string, value: string) => {
    onChange({ [field]: value } as Partial<LookbookComponent>);
  };

  const arrayEditor = useArrayEditor<LookbookComponent>(onChange);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={component.src ?? ""}
          onChange={(e) => handleInput("src", e.target.value)}
          placeholder="Image URL"
          className="flex-1"
        />
        <ImagePicker onSelect={(url) => handleInput("src", url)}>
          <Button type="button" variant="outline">
            Pick
          </Button>
        </ImagePicker>
      </div>
      <Input
        value={component.alt ?? ""}
        onChange={(e) => handleInput("alt", e.target.value)}
        placeholder="Alt text"
      />
      {arrayEditor(
        "hotspots",
        component.hotspots,
        ["sku", "x", "y"],
        {
          minItems: component.minItems,
          maxItems: component.maxItems,
        }
      )}
    </div>
  );
}
