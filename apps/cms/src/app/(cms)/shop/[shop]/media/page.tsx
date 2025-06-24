// apps/cms/src/app/(cms)/shop/[shop]/media/page.tsx

export default function MediaPage({ params }: { params: { shop: string } }) {
  const { shop } = params;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Media – {shop}</h2>
      <p className="text-muted-foreground text-sm">
        Drag-and-drop media manager coming soon.
      </p>
    </div>
  );
}
