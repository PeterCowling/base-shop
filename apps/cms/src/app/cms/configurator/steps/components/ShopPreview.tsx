interface ShopPreviewProps {
  logos: Record<string, string>;
  shopName: string;
}

export default function ShopPreview({ logos, shopName }: ShopPreviewProps) {
  const src =
    logos["desktop-landscape"] ||
    Object.values(logos)[0] ||
    "";
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={shopName} className="h-8 w-8 object-contain" />
      ) : (
        <div className="h-8 w-8 bg-gray-200" />
      )}
      <span>{shopName || "Store Name"}</span>
    </div>
  );
}
