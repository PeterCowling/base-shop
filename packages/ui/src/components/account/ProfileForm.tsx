"use client";

// packages/ui/src/components/account/ProfileForm.tsx
import { useState } from "react";

export interface ProfileFormProps {
  /** Pre-filled name value; may be undefined if profile data is missing */
  name?: string | undefined;
  /** Pre-filled email value; may be undefined if profile data is missing */
  email?: string | undefined;
}

export default function ProfileForm({ name = "", email = "" }: ProfileFormProps) {
  const [form, setForm] = useState({ name, email });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[e.target.name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage(null);
    setErrors({});
    try {
      const csrfToken =
        typeof document !== "undefined"
          ? document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content") ??
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("csrf_token="))
              ?.split("=")[1]
          : undefined;
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
        if (res.status === 400 && data && typeof data === "object" && !("error" in data)) {
          const fieldErrors = data as Record<string, string[]>;
          setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([key, value]) => [key, value[0]])
            )
          );
          setMessage("Please fix the errors below.");
        } else {
          setMessage(data.error ?? "Update failed");
        }
        return;
      }
      setStatus("success");
      setMessage("Profile updated successfully.");
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="flex flex-col">
        <label htmlFor="name" className="mb-1">Name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="rounded border p-2"
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="email" className="mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="rounded border p-2"
        />
        {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
      </div>
      <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-fg">Save</button>
      {status === "success" && <p className="text-green-600">{message}</p>}
      {status === "error" && <p className="text-red-600">{message}</p>}
    </form>
  );
}

