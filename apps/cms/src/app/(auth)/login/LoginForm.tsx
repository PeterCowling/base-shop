// apps/cms/src/app/(auth)/login/LoginForm.tsx

"use client";

import { Button, Input } from "@/components/atoms-shadcn";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ fallbackUrl }: { fallbackUrl: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? fallbackUrl;

  function absolutify(url: string): string {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("[LoginForm] submit", { email, callbackUrl });

    const absoluteUrl = absolutify(callbackUrl);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: absoluteUrl,
    });

    console.log("[LoginForm] signIn result", res);

    if (res?.ok) {
      console.log("[LoginForm] redirect to", callbackUrl);

      router.push(callbackUrl);
    } else {
      setError(res?.error ?? "Invalid email or password");
      if (res?.error) console.error("Login error:", res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-40 w-72 space-y-4">
      <h2 className="text-lg font-semibold">Sign in</h2>

      <Input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="w-full"
      />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="w-full"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button className="w-full" type="submit">
        Continue
      </Button>
      <p className="text-center text-sm">
        <Link href="/signup" className="underline">
          Create new account
        </Link>
      </p>
    </form>
  );
}
