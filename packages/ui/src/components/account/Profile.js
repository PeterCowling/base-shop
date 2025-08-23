import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/src/components/account/Profile.tsx
import { getCustomerSession, hasPermission } from "@auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";
export const metadata = { title: "Profile" };
export default async function ProfilePage({ title = "Profile", callbackUrl = "/account/profile", }) {
    const session = await getCustomerSession();
    if (!session) {
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return null;
    }
    const profile = await getCustomerProfile(session.customerId);
    const canManageProfile = hasPermission(session.role, "manage_profile");
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "mb-4 text-xl", children: title }), _jsx(ProfileForm, { name: profile?.name, email: profile?.email }), canManageProfile && (_jsx("div", { className: "mt-4", children: _jsx(Link, { href: "/account/change-password", className: "text-sm underline", children: "Change password" }) }))] }));
}
