import CashHub from "@/components/cash/CashHub";
import Providers from "@/components/ClientProviders";

export const dynamic = "force-dynamic";

export default function CashPage() {
  return (
    <Providers>
      <CashHub />
    </Providers>
  );
}
