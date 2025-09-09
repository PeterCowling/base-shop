import { Logo } from "@acme/ui";

interface ShopPreviewProps {
  logo: string;
  shopName: string;
}

export default function ShopPreview({ logo, shopName }: ShopPreviewProps) {
  const fallbackName = shopName || "Store Name";
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <Logo
        src={logo || undefined}
        shopName={fallbackName}
        alt={fallbackName}
        className="h-8 w-8 object-contain"
      />
      <span>{fallbackName}</span>
    </div>
  );
}
