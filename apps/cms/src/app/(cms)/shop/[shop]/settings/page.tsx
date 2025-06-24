// apps/cms/src/app/(cms)/shop/[shop]/settings/page.tsx

export default function SettingsPage({ params }: { params: { shop: string } }) {
  const { shop } = params;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings – {shop}</h2>
      <p className="text-muted-foreground text-sm">
        Shop configuration coming soon.
      </p>
    </div>
  );
}
