import Providers from "@/components/ClientProviders";
import EodHub from "@/components/eod/EodHub";

export const dynamic = "force-dynamic";

export default function EodPage() {
  return (
    <Providers>
      <EodHub />
    </Providers>
  );
}
