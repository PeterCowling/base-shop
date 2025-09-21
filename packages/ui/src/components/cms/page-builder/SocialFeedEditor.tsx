import type { SocialFeedComponent } from "@acme/types";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<SocialFeedComponent>;

export default function SocialFeedEditor({ component, onChange }: Props) {
  const handleInput = (
    field: keyof SocialFeedComponent & string,
    value: string,
  ) => {
    onChange({ [field]: value } as Partial<SocialFeedComponent>);
  };

  return (
    <div className="space-y-2">
      <Select
        value={component.platform ?? ""}
        onValueChange={(v) => handleInput("platform", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="twitter">twitter</SelectItem>
          <SelectItem value="instagram">instagram</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={component.account ?? ""}
        onChange={(e) => handleInput("account", e.target.value)}
        placeholder="account"
      />
      <Input
        value={component.hashtag ?? ""}
        onChange={(e) => handleInput("hashtag", e.target.value)}
        placeholder="hashtag"
      />
    </div>
  );
}
