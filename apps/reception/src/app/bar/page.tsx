import BarRoot from "@/components/bar/Bar";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function BarPage() {
  return (
    <Providers>
      <BarRoot />
    </Providers>
  );
}
