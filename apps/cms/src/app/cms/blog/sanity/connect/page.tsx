// apps/cms/src/app/cms/blog/sanity/connect/page.tsx
"use client";

import { Button, Toast } from "@ui";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";
import { useFormState } from "react-dom";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@platform-core/utils";

export default function SanityConnectPage() {
  const pathname = usePathname();
  const shopId = getShopFromPath(pathname) ?? "";
  const action = saveSanityConfig.bind(null, shopId);
  const [state, formAction] = useFormState(action, {
    message: "",
    error: "",
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect Sanity</h2>
      <form action={formAction} className="max-w-md space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="projectId">
            Project ID
          </label>
          <input
            id="projectId"
            name="projectId"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="dataset">
            Dataset
          </label>
          <input
            id="dataset"
            name="dataset"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="token">
            Token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            className="w-full rounded border p-2"
            required
          />
        </div>
        <Button type="submit" className="bg-primary text-white">
          Save
        </Button>
      </form>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
