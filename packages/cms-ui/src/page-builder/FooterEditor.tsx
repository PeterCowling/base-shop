import type { FooterComponent } from "@acme/types";

import { Input } from "@acme/design-system/shadcn";
import type { LogoVariants } from "@acme/ui/organisms/types";

import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

interface ExtendedFooterComponent extends FooterComponent {
  logoVariants?: LogoVariants;
  shopName?: string;
}

type Props = EditorProps<ExtendedFooterComponent>;

export default function FooterEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<ExtendedFooterComponent>(onChange);
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
      {arrayEditor("links", component.links, ["label", "url"])}
    </div>
  );
}
