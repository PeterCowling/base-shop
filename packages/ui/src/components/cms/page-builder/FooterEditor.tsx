import type { FooterComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: FooterComponent;
  onChange: (patch: Partial<FooterComponent>) => void;
}

export default function FooterEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<FooterComponent>(onChange);
  return (
    <div className="space-y-2">
      <Input
        value={component.logo ?? ""}
        onChange={(e) => onChange({ logo: e.target.value } as Partial<FooterComponent>)}
        placeholder="logo"
      />
      {arrayEditor("links", component.links, ["label", "url"])}
    </div>
  );
}
