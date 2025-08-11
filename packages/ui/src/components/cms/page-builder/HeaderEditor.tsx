import type { PageComponent } from "@types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function HeaderEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return (
    <div className="space-y-2">
      <Input
        value={(component as any).logo ?? ""}
        onChange={(e) => onChange({ logo: e.target.value } as Partial<PageComponent>)}
        placeholder="logo"
      />
      {arrayEditor("nav", (component as any).nav, ["label", "url"])}
    </div>
  );
}
