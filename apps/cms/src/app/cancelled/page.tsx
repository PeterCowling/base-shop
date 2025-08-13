// apps/cms/src/app/cancelled/page.tsx

type Props = { searchParams?: { error?: string } };

export default function Cancelled({ searchParams }: Props) {
  const error = searchParams?.error;
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Payment cancelled</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>You have not been charged. Feel free to keep shopping.</p>
      )}
    </div>
  );
}
