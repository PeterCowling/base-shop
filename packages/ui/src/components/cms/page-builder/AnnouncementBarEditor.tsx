import type { AnnouncementBarComponent } from "@acme/types";
import type { EditorProps } from "./EditorProps";
import { Input } from "../../atoms/shadcn";
import LocalizedTextInput from "../LocalizedTextInput";

type Props = EditorProps<AnnouncementBarComponent>;

export default function AnnouncementBarEditor({ component, onChange }: Props) {
  const handleInput = (field: keyof AnnouncementBarComponent & string, value: string) => {
    onChange({ [field]: value } as Partial<AnnouncementBarComponent>);
  };

  return (
    <div className="space-y-2">
      <LocalizedTextInput
        label="Text"
        value={component.text ?? ""}
        onChange={(v) => handleInput("text", v)}
      />
      <Input
        value={component.link ?? ""}
        onChange={(e) => handleInput("link", e.target.value)}
        placeholder="link"
      />
    </div>
  );
}
