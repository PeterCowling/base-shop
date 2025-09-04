// apps/cms/src/app/(auth)/login/LoginForm.tsx

"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ fallbackUrl }: { fallbackUrl: string }) {
  const router = useRouter();
  const search = useSearchParams();
  let callbackUrl = search.get("callbackUrl") ?? fallbackUrl;
  // Normalize bad values sometimes seen when links pass literal "null"
  if (!callbackUrl || callbackUrl === "null" || callbackUrl === "undefined") {
    callbackUrl = fallbackUrl;
  }

  function absolutify(url: string): string {
    try {
      const abs = new URL(url, window.location.origin);
      // Force same-origin to avoid open redirects
      abs.protocol = window.location.protocol;
      abs.host = window.location.host;
      return abs.toString();
    } catch {
      return url;
    }
  }

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("username") as string) || "";
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
    <form method="get" onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <Input
        name="username"
        type="text"
        label="Email"
        placeholder="admin@example.com"
        autoComplete="username"
        // Ensure high-contrast, visible input text regardless of page theme
        className="bg-white text-black dark:bg-white dark:text-black"
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        // Ensure high-contrast, visible input text while obscured
        className="bg-white text-black dark:bg-white dark:text-black"
        required
      />

      {error && <span className="block text-sm text-red-500">{error}</span>}

      <Button className="h-12 w-full" type="submit">
        Continue
      </Button>
      <p className="mt-4 text-center text-sm">
        <Link href="/signup" prefetch={false} className="text-blue-500 hover:underline">
          Create new account
        </Link>
      </p>
    </form>
  );
}
