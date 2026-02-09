import Providers from "@/components/Providers";
import SafeManagement from "@/components/safe/SafeManagement";
import { SafeDataProvider } from "@/context/SafeDataContext";
import { TillShiftProvider } from "@/hooks/client/till/TillShiftProvider";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function SafeManagementPage() {
  return (
    <Providers>
      <TillShiftProvider>
        <SafeDataProvider>
          <SafeManagement />
        </SafeDataProvider>
      </TillShiftProvider>
    </Providers>
  );
}
