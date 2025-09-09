import type { ShopLogo } from "@acme/types";

interface ShopPreviewProps {
  logo: ShopLogo;
  storeName: string;
}

export default function ShopPreview({ logo, storeName }: ShopPreviewProps) {
  const src =
    logo.desktop?.landscape ||
    logo.desktop?.portrait ||
    logo.mobile?.landscape ||
    logo.mobile?.portrait;
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Logo preview" className="h-8 w-8 object-contain" />
      ) : (
        <div className="h-8 w-8 bg-gray-200" />
      )}
      <span>{storeName || "Store Name"}</span>
    </div>
  );
}
