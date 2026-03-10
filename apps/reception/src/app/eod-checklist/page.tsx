import Providers from "@/components/ClientProviders";
import EodChecklistContent from "@/components/eodChecklist/EodChecklistContent";

export const dynamic = "force-dynamic";

export default function EodChecklistPage() {
  return (
    <Providers>
      <EodChecklistContent />
    </Providers>
  );
}
