import Providers from "@/components/ClientProviders";
import PrimeRequestsQueue from "@/components/prime-requests/PrimeRequestsQueue";

export const dynamic = "force-dynamic";

export default function PrimeRequestsPage() {
  return (
    <Providers>
      <PrimeRequestsQueue />
    </Providers>
  );
}
