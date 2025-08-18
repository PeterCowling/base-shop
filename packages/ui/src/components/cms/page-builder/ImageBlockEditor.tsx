import type { ImageComponent } from "@acme/types/src/page/atoms";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";

interface Props {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponent>) => void;
}

export default function ImageBlockEditor({ component, onChange }: Props) {
  const handleInput = (field: keyof ImageComponent & string, value: string) => {
    onChange({ [field]: value } as Partial<ImageComponent>);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={component.src ?? ""}
          onChange={(e) => handleInput("src", e.target.value)}
          placeholder="src"
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
        placeholder="alt"
      />
    </div>
  );
}
