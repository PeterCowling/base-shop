// apps/cms/src/app/cms/blog/sanity/connect/page.tsx
import { Button } from "@/components/atoms/shadcn";
import { saveSanityConfig } from "@cms/actions/saveSanityConfig";

export const revalidate = 0;

export default function SanityConnectPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect Sanity</h2>
      <form action={saveSanityConfig} className="space-y-4 max-w-md">
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
    </div>
  );
}
