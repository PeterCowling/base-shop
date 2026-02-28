import Providers from "@/components/ClientProviders";
import StaffAccountsForm from "@/components/userManagement/StaffAccountsForm";

// Prevent static prerendering — Firebase auth requires runtime env vars
export const dynamic = "force-dynamic";

export default function StaffAccountsPage() {
  return (
    <Providers>
      <StaffAccountsForm />
    </Providers>
  );
}
