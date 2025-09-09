interface ShopPreviewProps {
  logo: string;
  shopName: string;
}

export default function ShopPreview({ logo, shopName }: ShopPreviewProps) {
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={shopName} className="h-8 w-8 object-contain" />
      ) : (
        <div className="h-8 w-8 bg-gray-200" />
      )}
      <span>{shopName || "Store Name"}</span>
    </div>
  );
}
