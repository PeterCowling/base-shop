"use client";

// apps/shop-abc/src/app/account/profile/ProfileForm.tsx
import { useState } from "react";

interface ProfileFormProps {
  name?: string;
  email?: string;
}

export default function ProfileForm({ name, email }: ProfileFormProps) {
  const [form, setForm] = useState({ name: name ?? "", email: email ?? "" });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error ?? "Update failed");
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
      </div>
      <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-fg">Save</button>
      {status === "success" && <p className="text-green-600">{message}</p>}
      {status === "error" && <p className="text-red-600">{message}</p>}
    </form>
  );
}

