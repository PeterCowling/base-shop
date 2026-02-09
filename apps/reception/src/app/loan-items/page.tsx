import Providers from "@/components/Providers";

import LoanItemsContent from "./LoanItemsContent";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function LoanItemsPage() {
  return (
    <Providers>
      <LoanItemsContent />
    </Providers>
  );
}
