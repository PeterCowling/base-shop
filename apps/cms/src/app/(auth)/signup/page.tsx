// apps/cms/src/app/(auth)/signup/page.tsx
import { redirect } from "next/navigation";
import { requestAccount } from "@cms/actions/accounts.server";

import { Button, Input } from "@/components/atoms/shadcn";

export default function SignupPage() {
  async function createAccount(formData: FormData) {
    "use server";
    await requestAccount(formData);
    redirect("/login");
  }

  return (
    <form action={createAccount} className="mx-auto mt-40 w-72 space-y-4">
      <h2 className="text-lg font-semibold">Create account</h2>
      <Input
        name="name"
        type="text"
        placeholder="Name"
        required
        className="w-full"
      />
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
      <Button className="w-full" type="submit">
        Submit request
      </Button>
    </form>
  );
}
