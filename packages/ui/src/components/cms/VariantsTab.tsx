import { Card, CardContent, Input } from "../atoms/shadcn";
import { Chip, IconButton } from "../atoms";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import type { ChangeEvent } from "react";
import { useTranslations } from "@acme/i18n";

interface VariantsTabProps {
  variants: Record<string, string[]>;
  onVariantChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAddVariantValue: (attr: string) => void;
  onRemoveVariantValue: (attr: string, index: number) => void;
}

export default function VariantsTab({
  variants,
  onVariantChange,
  onAddVariantValue,
  onRemoveVariantValue,
}: VariantsTabProps) {
  const t = useTranslations();
  const variantEntries = Object.entries(variants) as [string, string[]][];

  if (variantEntries.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("This product has no variant dimensions configured.")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {variantEntries.map(([attr, values]) => (
        <Card key={attr}>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Chip className="bg-muted px-2 py-1 text-xs uppercase tracking-wide">
                {attr}
              </Chip>
              <IconButton
                aria-label={`Add option to ${attr}`}
                onClick={() => onAddVariantValue(attr)}
                variant="secondary"
              >
                <PlusIcon />
              </IconButton>
            </div>
            <div className="space-y-3">
              {values.map((value: string, index: number) => (
                <div key={`${attr}:${value}`} className="flex items-center gap-2">
                  <Input
                    name={`variant_${attr}_${index}`}
                    value={value}
                    onChange={onVariantChange}
                    className="flex-1"
                  />
                  <IconButton
                    aria-label={`Remove ${attr} option ${index + 1}`}
                    onClick={() => onRemoveVariantValue(attr, index)}
                    variant="ghost"
                  >
                    <Cross2Icon />
                  </IconButton>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
