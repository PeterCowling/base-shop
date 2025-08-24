import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// packages/ui/src/components/account/Sessions.tsx
import { redirect } from "next/navigation";
import RevokeSessionButton from "./RevokeSessionButton";
import { revoke } from "../../actions/revokeSession";
export const metadata = { title: "Sessions" };
export default async function SessionsPage({ title = "Sessions", callbackUrl = "/account/sessions", } = {}) {
    const { getCustomerSession, listSessions, hasPermission } = await import("@auth");
    const session = await getCustomerSession();
    if (!session) {
        redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return null;
    }
    if (!hasPermission(session.role, "manage_sessions")) {
        return _jsx("p", { className: "p-6", children: "Not authorized." });
    }
    const sessions = await listSessions(session.customerId);
    if (!sessions.length)
        return _jsx("p", { className: "p-6", children: "No active sessions." });
    return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "p-6 text-xl", children: title }), _jsx("ul", { className: "space-y-2 p-6", children: sessions.map((s) => (_jsxs("li", { className: "flex items-center justify-between rounded border p-4", children: [_jsxs("div", { children: [_jsx("div", { children: s.userAgent }), _jsx("div", { className: "text-sm text-muted", "data-token": "--color-muted", children: s.createdAt.toISOString() })] }), _jsx(RevokeSessionButton, { revoke: revoke, sessionId: s.sessionId })] }, s.sessionId))) })] }));
}
