import type { PageComponent } from "@acme/types";

type HeaderComponent = Extract<PageComponent, { type: "Header" }>;
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: HeaderComponent;
  onChange: (patch: Partial<HeaderComponent>) => void;
}

export default function HeaderEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<HeaderComponent>(onChange);
  return (
    <div className="space-y-2">
      <Input
        value={component.logo ?? ""}
        onChange={(e) => onChange({ logo: e.target.value } as Partial<HeaderComponent>)}
        placeholder="logo"
      />
      {arrayEditor("nav", component.nav, ["label", "url"])}
    </div>
  );
}
