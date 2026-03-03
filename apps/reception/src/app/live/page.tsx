import Providers from "@/components/ClientProviders";
import Live from "@/components/live/Live";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <Providers>
      <Live />
    </Providers>
  );
}
