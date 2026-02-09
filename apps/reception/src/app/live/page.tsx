import Live from "@/components/live/Live";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function LivePage() {
  return (
    <Providers>
      <Live />
    </Providers>
  );
}
