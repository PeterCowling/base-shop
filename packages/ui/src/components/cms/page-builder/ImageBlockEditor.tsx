import type { PageComponent } from "@acme/types";
import { Button, Input } from "../../atoms/shadcn";
import ImagePicker from "./ImagePicker";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function ImageBlockEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Input
          value={(component as any).src ?? ""}
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
        value={(component as any).alt ?? ""}
        onChange={(e) => handleInput("alt", e.target.value)}
        placeholder="alt"
      />
    </div>
  );
}
