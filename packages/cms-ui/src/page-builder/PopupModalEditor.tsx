import type { PopupModalComponent } from "@acme/types";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@acme/design-system/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<PopupModalComponent>;

export default function PopupModalEditor({ component, onChange }: Props) {
  const handleInput = (field: keyof PopupModalComponent & string, value: unknown) => {
    onChange({ [field]: value } as Partial<PopupModalComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={component.width ?? ""}
        onChange={(e) => handleInput("width", e.target.value)}
        placeholder="width"
      />
      <Input
        value={component.height ?? ""}
        onChange={(e) => handleInput("height", e.target.value)}
        placeholder="height"
      />
      <Select
        value={component.trigger ?? ""}
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
      <Input
        type="number"
        value={component.delay ?? ""}
        onChange={(e) =>
          handleInput(
            "delay",
            e.target.value ? Number(e.target.value) : undefined
          )
        }
        placeholder="delay (ms)"
      />
      <Textarea
        value={component.content ?? ""}
        onChange={(e) => handleInput("content", e.target.value)}
        placeholder="content"
      />
    </div>
  );
}
