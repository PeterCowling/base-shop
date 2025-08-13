// apps/cms/src/app/cancelled/page.tsx

export default function Cancelled({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const { error } = searchParams;
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Payment cancelled</h1>
      {error && <p className="mb-4">{error}</p>}
      <p>You have not been charged. Feel free to keep shopping.</p>
    </div>
  );
}
