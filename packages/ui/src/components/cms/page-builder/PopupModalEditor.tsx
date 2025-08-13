import type { PageComponent } from "@acme/types";
import {
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

export default function PopupModalEditor({ component, onChange }: Props) {
  const handleInput = (field: string, value: unknown) => {
    onChange({ [field]: value } as Partial<PageComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={(component as any).width ?? ""}
        onChange={(e) => handleInput("width", e.target.value)}
        placeholder="width"
      />
      <Input
        value={(component as any).height ?? ""}
        onChange={(e) => handleInput("height", e.target.value)}
        placeholder="height"
      />
      <Select
        value={(component as any).trigger ?? ""}
        onValueChange={(v) => handleInput("trigger", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="trigger" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="load">load</SelectItem>
          <SelectItem value="delay">delay</SelectItem>
          <SelectItem value="exit">exit intent</SelectItem>
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
