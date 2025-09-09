import { Logo } from "@acme/ui";

interface ShopPreviewProps {
  logo: string;
  storeName: string;
}

export default function ShopPreview({ logo, storeName }: ShopPreviewProps) {
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <Logo
        src={logo}
        alt={storeName}
        textFallback={storeName || "Store Name"}
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
      />
      <span>{storeName || "Store Name"}</span>
    </div>
  );
}
