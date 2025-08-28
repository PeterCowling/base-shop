import Link from "next/link";

export default async function ShopThemeSettingsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Theme Settings – {shop}</h2>
      <p className="text-sm">
        <Link href="/cms/themes/library" className="text-primary underline">
          Open theme library
        </Link>
      </p>
    </div>
  );
}
