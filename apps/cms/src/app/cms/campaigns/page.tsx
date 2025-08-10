// apps/cms/src/app/cms/campaigns/page.tsx
import { sendCampaignEmail } from "@cms/actions/campaigns.server";

export default function CampaignPage() {
  return (
    <form action={sendCampaignEmail} className="space-y-4">
      <div>
        <label htmlFor="to" className="block text-sm font-medium">
          Recipients
        </label>
        <input
          id="to"
          name="to"
          className="mt-1 w-full rounded border p-2"
          placeholder="user@example.com, other@example.com"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          className="mt-1 w-full rounded border p-2"
        />
      </div>
      <div>
        <label htmlFor="html" className="block text-sm font-medium">
          HTML Content
        </label>
        <textarea
          id="html"
          name="html"
          className="mt-1 w-full rounded border p-2"
          rows={6}
        />
      </div>
      <button
        type="submit"
        className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
      >
        Send Campaign
      </button>
    </form>
  );
}
