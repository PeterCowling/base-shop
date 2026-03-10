import Providers from "@/components/ClientProviders";
import Alloggiati from "@/components/man/Alloggiati";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function AlloggiatiPage() {
  return (
    <Providers>
      <Alloggiati />
    </Providers>
  );
}
