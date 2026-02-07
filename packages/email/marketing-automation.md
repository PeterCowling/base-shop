# Marketing Automation

This package supports scheduled campaign delivery, contact segmentation, and analytics tracking.

## Scheduling campaigns

Campaign metadata lives in `data/<shop>/campaigns.json`. The `sendScheduledCampaigns` helper reads this file and delivers any campaigns whose `sendAt` timestamp has passed. A Cloudflare worker can invoke it on a cron schedule via the exported `onScheduled` handler:

```ts
import { onScheduled } from "../../functions/marketing-email-sender";

export default {
  scheduled: onScheduled,
};
```

Campaigns are created through the CMS API. The payload may target a manual list of recipients or resolve a segment at send time:

```ts
await fetch("/api/marketing/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    shop: "demo",
    segment: "vip", // or recipients: ["a@example.com"]
    subject: "Flash Sale",
    body: "<p>Everything 20% off today</p>",
    sendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }),
});
```

## Segmentation

Segments are backed by analytics events. Recording either `segment:<id>` or `segment` events assigns contacts to a segment. `resolveSegment` reads the event log and returns the current members:

```ts
import { trackEvent } from "@acme/platform-core/analytics";
import { resolveSegment } from "@acme/email";

await trackEvent("demo", { type: "segment:vip", email: "ada@example.com" });
// equivalent form
await trackEvent("demo", { type: "segment", segment: "vip", email: "ada@example.com" });

const vipRecipients = await resolveSegment("demo", "vip");
```

## Analytics

Delivery and engagement metrics are likewise stored as analytics events (`email_sent`, `email_open`, `email_click`). They can be aggregated to report campaign performance:

```ts
import { listEvents } from "@acme/platform-core/repositories/analytics.server";

const events = await listEvents("demo");
const sent = events.filter((e) => e.type === "email_sent" && e.campaign === "c1").length;
const opened = events.filter((e) => e.type === "email_open" && e.campaign === "c1").length;
const clicked = events.filter((e) => e.type === "email_click" && e.campaign === "c1").length;

const openRate = sent ? opened / sent : 0;
const clickRate = sent ? clicked / sent : 0;
```

These metrics correspond to the values returned by the CMS `/api/marketing/email` endpoint and can guide future campaign iterations.

Custom analytics handlers can be registered through hooks exported from `@acme/email`. Use `onSend`, `onOpen`, and `onClick` to listen for campaign activity and run additional logic:

```ts
import { onSend, onOpen, onClick } from "@acme/email";

onSend((shop, { campaign }) => {
  console.log("sent", shop, campaign);
});

onOpen((shop, { campaign }) => {
  // send to an external analytics service
});

onClick((shop, { campaign }) => {
  // custom click tracking
});
```

The default listeners continue to record analytics events, so existing metrics remain available while allowing additional tracking behavior.
