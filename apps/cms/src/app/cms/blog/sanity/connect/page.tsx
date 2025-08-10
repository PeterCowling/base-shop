// apps/cms/src/app/cms/blog/sanity/connect/page.tsx
import ConnectForm from "./ConnectForm.client";

export const revalidate = 0;

export default function SanityConnectPage({
  searchParams,
}: {
  searchParams?: { shopId?: string };
}) {
  const shopId = searchParams?.shopId;
  if (!shopId) return <p>No shop selected.</p>;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect Sanity</h2>
      <ConnectForm shopId={shopId} />
    </div>
  );
}
