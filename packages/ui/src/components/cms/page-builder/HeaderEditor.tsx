import type { HeaderComponent } from "@acme/types";
import { Input } from "../../atoms/shadcn";
import { useArrayEditor } from "./useArrayEditor";
import type { LogoVariants } from "../../organisms/types";
import type { EditorProps } from "./EditorProps";

interface ExtendedHeaderComponent extends HeaderComponent {
  logoVariants?: LogoVariants;
  shopName?: string;
}

type Props = EditorProps<ExtendedHeaderComponent>;

export default function HeaderEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ExtendedHeaderComponent>(onChange);
  const updateVariant = (viewport: keyof LogoVariants, value: string) => {
    onChange({
      logoVariants: {
        ...component.logoVariants,
        [viewport]: { src: value },
      },
    });
  };
  return (
    <div className="space-y-2">
      <Input
        value={component.shopName ?? ""}
        onChange={(e) => onChange({ shopName: e.target.value })}
        placeholder="shop name"
      />
      <Input
        value={component.logoVariants?.desktop?.src ?? ""}
        onChange={(e) => updateVariant("desktop", e.target.value)}
        placeholder="desktop logo"
      />
      <Input
        value={component.logoVariants?.tablet?.src ?? ""}
        onChange={(e) => updateVariant("tablet", e.target.value)}
        placeholder="tablet logo"
      />
      <Input
        value={component.logoVariants?.mobile?.src ?? ""}
        onChange={(e) => updateVariant("mobile", e.target.value)}
        placeholder="mobile logo"
      />
      {arrayEditor("nav", component.nav, ["label", "url"])}
    </div>
  );
}
