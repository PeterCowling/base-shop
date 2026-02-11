import PrimeRequestsQueue from "@/components/prime-requests/PrimeRequestsQueue";
import Providers from "@/components/Providers";

export const dynamic = "force-dynamic";

export default function PrimeRequestsPage() {
  return (
    <Providers>
      <PrimeRequestsQueue />
    </Providers>
  );
}
