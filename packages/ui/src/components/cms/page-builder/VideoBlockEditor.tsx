import type { PageComponent } from "@acme/types";
import { Input, Checkbox } from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function VideoBlockEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string | boolean) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Video URL"
        value={(component as any).src ?? ""}
        onChange={(e) => handleInput("src", e.target.value)}
        placeholder="https://..."
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="autoplay"
          checked={(component as any).autoplay ?? false}
          onCheckedChange={(checked) => handleInput("autoplay", Boolean(checked))}
        />
        <label htmlFor="autoplay" className="text-sm">
          Autoplay
        </label>
      </div>
    </div>
  );
}
