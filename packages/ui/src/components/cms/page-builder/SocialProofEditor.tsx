// packages/ui/src/components/cms/page-builder/SocialProofEditor.tsx
import type { SocialProofComponent } from "@acme/types";

import { Input } from "../../atoms/shadcn";

import type { EditorProps } from "./EditorProps";

type Props = EditorProps<SocialProofComponent>;

export default function SocialProofEditor({ component, onChange }: Props) {
  // i18n-exempt — Editor input placeholders; not user-visible site content
  /* i18n-exempt */ const t = (s: string) => s;
  const handleInput = (
    field: keyof SocialProofComponent & string,
    value: string | number | undefined,
  ) => {
    onChange({ [field]: value } as Partial<SocialProofComponent>);
  };

  return (
    <div className="space-y-2">
      <Input
        value={component.source ?? ""}
        onChange={(e) => handleInput("source", e.target.value)}
        placeholder={t("data source URL")}
      />
      <Input
        type="number"
        value={component.frequency ?? ""}
        onChange={(e) =>
          handleInput(
            "frequency",
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        placeholder={t("frequency (ms)")}
      />
    </div>
  );
}
