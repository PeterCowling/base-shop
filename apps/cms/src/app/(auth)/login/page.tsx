// apps/cms/src/app/(auth)/login/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/shop/abc/products";

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await signIn("credentials", {
      redirect: false, // stay on /login
      email,
      password,
      callbackUrl,
    });

    if (res?.ok) {
      router.push(res.url ?? callbackUrl); // <— navigate
    } else {
      setError(res?.error ?? "Invalid email or password");
      if (res?.error) console.error("Login error:", res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-40 w-72 space-y-4">
      <h2 className="text-lg font-semibold">Sign in</h2>

      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full rounded-md border px-3 py-2"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
        Continue
      </button>
    </form>
  );
}
