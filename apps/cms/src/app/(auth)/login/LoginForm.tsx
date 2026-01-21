// apps/cms/src/app/(auth)/login/LoginForm.tsx

"use client";

import type { ChangeEvent,FormEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button, Input } from "@/components/atoms/shadcn";

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
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(
    e?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
  ) {
    e?.preventDefault?.();
    setError(null);
    const email = username.trim();
    const password = pwd;

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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <Input
        name="username"
        type="text"
        label="Email"
        placeholder="admin@example.com"
        autoComplete="username"
        value={username}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setUsername(e.target.value)
        }
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={pwd}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPwd(e.target.value)}
        required
      />

      {error && <span className="block text-sm text-danger-foreground">{error}</span>}

      <Button className="h-12 w-full" type="button" onClick={handleSubmit}>
        Continue
      </Button>
      <p className="mt-4 text-center text-sm">
        <Link href="/signup" prefetch={false} className="text-link hover:underline">
          Create new account
        </Link>
      </p>
    </form>
  );
}
