import type { PageComponent } from "@types";
import { Input } from "../../atoms/shadcn";
import { Switch } from "../../atoms/Switch";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function VideoBlockEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: any) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  const data = component as any;

  return (
    <div className="space-y-2">
      <Input
        value={data.src ?? ""}
        onChange={(e) => handleInput("src", e.target.value)}
        placeholder="Video URL"
      />
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={data.autoplay ?? false}
          onChange={(e) => handleInput("autoplay", e.target.checked)}
        />
        Autoplay
      </label>
    </div>
  );
}
