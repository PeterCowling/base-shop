// apps/cms/src/app/cms/ra/page.tsx
import { listReturnAuthorizations } from "@platform-core/returnAuthorization";
import { features } from "@platform-core/features";
import { notFound } from "next/navigation";
import type { ReturnAuthorization } from "@acme/types";

export const revalidate = 0;

export default async function RaDashboardPage() {
  if (!features.raTicketing) notFound();
  const ras: ReturnAuthorization[] = await listReturnAuthorizations();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Return Authorizations</h2>
      {ras.length === 0 ? (
        <p>No return authorizations.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">RA ID</th>
              <th className="p-2">Order ID</th>
              <th className="p-2">Status</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ras.map((ra) => (
              <tr key={ra.raId} className="border-b">
                <td className="p-2">{ra.raId}</td>
                <td className="p-2">{ra.orderId}</td>
                <td className="p-2">{ra.status}</td>
                <td className="p-2">{ra.inspectionNotes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
