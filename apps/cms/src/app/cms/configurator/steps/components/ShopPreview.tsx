import { Logo } from "@ui/components/atoms";

interface ShopPreviewProps {
  logos: Record<string, string>;
  shopName: string;
}

export default function ShopPreview({ logos, shopName }: ShopPreviewProps) {
  const src =
    logos["desktop-landscape"] ||
    Object.values(logos)[0] ||
    undefined;

  return (
    <div className="flex items-center gap-2 rounded border p-2">
      <Logo
        src={src}
        alt={shopName || "Store Name"}
        fallbackText={shopName || "Store Name"}
        className="object-contain"
      />
      <span>{shopName || "Store Name"}</span>
    </div>
  );
}
