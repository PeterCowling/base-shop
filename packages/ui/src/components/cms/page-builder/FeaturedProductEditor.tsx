import { Input } from "../../atoms/shadcn";
import { useTranslations } from "@acme/i18n";

type FeaturedProductComponent = {
  type: "FeaturedProduct";
  sku?: string;
  collectionId?: string;
};

interface Props {
  component: FeaturedProductComponent;
  onChange: (patch: Partial<FeaturedProductComponent>) => void;
}

export default function FeaturedProductEditor({ component, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <Input
        label={t("SKU")}
        placeholder={t("sku") as string}
        value={component.sku ?? ""}
        onChange={(e) => onChange({ sku: e.target.value })}
      />
      <Input
        label={t("Collection ID")}
        placeholder={t("collectionId") as string}
        value={component.collectionId ?? ""}
        onChange={(e) => onChange({ collectionId: e.target.value })}
      />
    </div>
  );
}
