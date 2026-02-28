import Providers from "@/components/ClientProviders";
import Extension from "@/components/man/Extension";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function ExtensionPage() {
  return (
    <Providers>
      <Extension />
    </Providers>
  );
}
