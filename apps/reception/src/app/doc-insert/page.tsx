import DocInsertPage from "@/components/checkins/docInsert/DocInsertPage";
import Providers from "@/components/ClientProviders";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function DocInsertRoutePage() {
  return (
    <Providers>
      <DocInsertPage />
    </Providers>
  );
}
