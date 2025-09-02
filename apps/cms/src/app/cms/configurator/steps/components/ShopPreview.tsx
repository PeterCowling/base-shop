interface ShopPreviewProps {
  logo: string;
  storeName: string;
}

export default function ShopPreview({ logo, storeName }: ShopPreviewProps) {
  return (
    <div className="flex items-center gap-2 rounded border p-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="Logo preview" className="h-8 w-8 object-contain" />
      ) : (
        <div className="h-8 w-8 bg-gray-200" />
      )}
      <span>{storeName || "Store Name"}</span>
    </div>
  );
}
