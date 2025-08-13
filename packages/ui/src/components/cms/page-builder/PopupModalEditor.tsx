import type { PageComponent } from "@acme/types";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../atoms/shadcn";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function PopupModalEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: string) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        label="Width"
        value={(component as any).width ?? ""}
        onChange={(e) => handleInput("width", e.target.value)}
      />
      <Input
        label="Height"
        value={(component as any).height ?? ""}
        onChange={(e) => handleInput("height", e.target.value)}
      />
      <Select
        value={(component as any).trigger ?? ""}
        onValueChange={(v) => handleInput("trigger", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="trigger" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="delay">delay</SelectItem>
          <SelectItem value="exitIntent">exitIntent</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        value={(component as any).content ?? ""}
        onChange={(e) => handleInput("content", e.target.value)}
        placeholder="content"
      />
    </div>
  );
}

