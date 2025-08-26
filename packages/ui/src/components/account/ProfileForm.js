"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/src/components/account/ProfileForm.tsx
import { useState } from "react";
import { getCsrfToken } from "@acme/shared-utils";
export default function ProfileForm({ name = "", email = "" }) {
    const [form, setForm] = useState({ name, email });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState(null);
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors((prev) => {
            const next = { ...prev };
            delete next[e.target.name];
            return next;
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("idle");
        setMessage(null);
        setErrors({});
        const newErrors = {};
        if (!form.name)
            newErrors.name = "Name is required.";
        if (!form.email)
            newErrors.email = "Email is required.";
        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            setStatus("error");
            setMessage("Please fix the errors below.");
            return;
        }
        try {
            const csrfToken = getCsrfToken();
            const res = await fetch("/api/account/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken ?? "",
                },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json();
                setStatus("error");
                if (res.status === 409) {
                    setErrors({ email: data.error ?? "Email already in use" });
                    setMessage(data.error ?? "Email already in use");
                }
                else if (res.status === 400 && data && typeof data === "object" && !("error" in data)) {
                    const fieldErrors = data;
                    setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([key, value]) => [key, value[0]])));
                    setMessage("Please fix the errors below.");
                }
                else {
                    setMessage(data.error ?? "Update failed");
                }
                return;
            }
            setStatus("success");
            setMessage("Profile updated successfully.");
        }
        catch {
            setStatus("error");
            setMessage("An unexpected error occurred.");
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 max-w-md", noValidate: true, children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "mb-1", children: "Name" }), _jsx("input", { id: "name", name: "name", value: form.name, onChange: handleChange, className: "rounded border p-2", required: true }), errors.name && (_jsx("p", { className: "text-danger text-sm", "data-token": "--color-danger", children: errors.name }))] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("label", { htmlFor: "email", className: "mb-1", children: "Email" }), _jsx("input", { id: "email", name: "email", type: "email", value: form.email, onChange: handleChange, className: "rounded border p-2", required: true }), errors.email && (_jsx("p", { className: "text-danger text-sm", "data-token": "--color-danger", children: errors.email }))] }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: "Save" }) }), status === "success" && (_jsx("p", { className: "text-success", "data-token": "--color-success", children: message })), status === "error" && (_jsx("p", { className: "text-danger", "data-token": "--color-danger", children: message }))] }));
}
