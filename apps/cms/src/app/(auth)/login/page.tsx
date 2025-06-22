"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    const res = await signIn("credentials", {
      redirect: false,
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!res?.error) router.push("/products");
  }

  return (
    <form action={handleLogin} className="mx-auto mt-40 w-72 space-y-4">
      <h2 className="text-lg font-semibold">Sign in</h2>
      <input
        name="email"
        placeholder="Email"
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        className="w-full rounded-md border px-3 py-2"
      />
      <button className="w-full rounded-md bg-primary px-4 py-2 text-white">
        Continue
      </button>
    </form>
  );
}
